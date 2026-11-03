import json
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.concurrency import run_in_threadpool

from . import agent, content, github
from .config import get_settings

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Osher's AI Twin API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Every character here is billed as Anthropic input tokens, so cap the payload.
# The agent only uses the last few turns; the frontend sends just those, and the
# history cap leaves headroom without letting a client stuff the context.
MAX_MESSAGE_CHARS = 2000
MAX_TURN_CHARS = 8000  # an assistant reply at max_tokens fits comfortably
MAX_HISTORY_TURNS = 20


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=MAX_TURN_CHARS)


class ChatRequest(BaseModel):
    message: str = Field(max_length=MAX_MESSAGE_CHARS)
    history: list[ChatTurn] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/github/repos")
async def repos():
    data = await run_in_threadpool(github.get_repos)
    return {"repos": data}


@app.get("/api/github/stats")
async def github_stats():
    return await run_in_threadpool(github.get_stats)


@app.get("/api/resume")
async def resume():
    markdown = await run_in_threadpool(content.get_resume_markdown)
    return {"markdown": markdown}


@app.get("/api/resume.pdf")
async def resume_pdf():
    pdf = await run_in_threadpool(content.get_resume_pdf)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=osher_boudara_resume.pdf"},
    )


@app.post("/api/chat")
@limiter.limit(settings.chat_rate_limit)
async def chat(request: Request, body: ChatRequest):
    message = (body.message or "").strip()
    if not message:
        return JSONResponse({"error": "empty message"}, status_code=400)

    corpus = await run_in_threadpool(content.get_corpus)
    history = [turn.model_dump() for turn in body.history]

    async def event_stream():
        try:
            async for delta in agent.stream_answer(message, history, corpus):
                yield f"data: {json.dumps({'delta': delta})}\n\n"
        except Exception:
            fallback = (
                "Sorry - Osher's AI Twin is resting right now. Please try again in "
                "a bit, or reach out to Osher directly."
            )
            yield f"data: {json.dumps({'delta': fallback})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
