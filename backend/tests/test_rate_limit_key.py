"""Chat rate limiting is keyed per visitor, not per Cloud Run proxy.

On Cloud Run every request arrives from the same internal proxy address
(169.254.x.x), so keying on the socket peer collapses all visitors into one
bucket. Google's front end appends the real client IP as the last
X-Forwarded-For entry; anything before it is client-supplied and spoofable.
"""

import pytest
from fastapi.testclient import TestClient
from starlette.requests import Request

from app import agent, content, main


def make_request(headers: dict[str, str], peer: str = "169.254.169.126") -> Request:
    raw = [(k.lower().encode(), v.encode()) for k, v in headers.items()]
    return Request({"type": "http", "headers": raw, "client": (peer, 1234)})


def test_uses_last_forwarded_entry():
    req = make_request({"X-Forwarded-For": "6.6.6.6, 203.0.113.7"})
    assert main.client_ip(req) == "203.0.113.7"


def test_single_forwarded_entry():
    assert main.client_ip(make_request({"X-Forwarded-For": "203.0.113.7"})) == "203.0.113.7"


def test_falls_back_to_peer_without_header():
    assert main.client_ip(make_request({}, peer="127.0.0.1")) == "127.0.0.1"


@pytest.fixture
def client(monkeypatch):
    async def fake_stream(message, history, corpus):
        yield "ok"

    monkeypatch.setattr(agent, "stream_answer", fake_stream)
    monkeypatch.setattr(content, "get_corpus", lambda: "corpus")
    main.limiter.reset()
    return TestClient(main.app)


def chat(client, xff: str):
    return client.post("/api/chat", json={"message": "hi"}, headers={"X-Forwarded-For": xff})


def test_one_visitor_hitting_the_limit_does_not_block_another(client):
    limit = int(main.settings.chat_rate_limit.split("/")[0])
    for _ in range(limit):
        assert chat(client, "203.0.113.7").status_code == 200
    assert chat(client, "203.0.113.7").status_code == 429
    # Spoofing a leading entry doesn't escape the bucket...
    assert chat(client, "1.2.3.4, 203.0.113.7").status_code == 429
    # ...but a genuinely different visitor is unaffected.
    assert chat(client, "198.51.100.9").status_code == 200
