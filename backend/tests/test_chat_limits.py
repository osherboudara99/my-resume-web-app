"""/api/chat input limits.

Every byte of message + history is billed as input tokens, so oversized or
malformed payloads must be rejected before they reach Anthropic.
"""

import pytest
from fastapi.testclient import TestClient

from app import agent, content, main


@pytest.fixture
def client(monkeypatch):
    async def fake_stream(message, history, corpus):
        yield "ok"

    monkeypatch.setattr(agent, "stream_answer", fake_stream)
    monkeypatch.setattr(content, "get_corpus", lambda: "corpus")
    main.limiter.reset()
    return TestClient(main.app)


def post(client, message="hi", history=None):
    return client.post("/api/chat", json={"message": message, "history": history or []})


def test_valid_request_at_the_limits_streams(client):
    history = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": "x" * main.MAX_TURN_CHARS}
        for i in range(main.MAX_HISTORY_TURNS)
    ]
    res = post(client, "q" * main.MAX_MESSAGE_CHARS, history)
    assert res.status_code == 200
    assert '"delta": "ok"' in res.text


def test_oversized_message_rejected(client):
    assert post(client, "q" * (main.MAX_MESSAGE_CHARS + 1)).status_code == 422


def test_too_many_history_turns_rejected(client):
    history = [{"role": "user", "content": "hi"}] * (main.MAX_HISTORY_TURNS + 1)
    assert post(client, history=history).status_code == 422


def test_oversized_history_turn_rejected(client):
    history = [{"role": "assistant", "content": "x" * (main.MAX_TURN_CHARS + 1)}]
    assert post(client, history=history).status_code == 422


def test_unknown_role_rejected(client):
    assert post(client, history=[{"role": "system", "content": "hi"}]).status_code == 422


def test_blank_message_rejected(client):
    assert post(client, "   ").status_code == 400
