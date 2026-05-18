"""
progress_service.py
───────────────────
Helpers that format SSE event payloads and emit them inside async generators.
Keeps the SSE wire-format in one place so main.py stays clean.

SSE event format (preserves the agreed contract from Milestone 3):
    data: {"step": "convert", "status": "running", "message": "..."}
"""

import json
from typing import AsyncGenerator


def sse_event(step: str, status: str, message: str) -> str:
    """Return a single SSE data line ready to yield from a StreamingResponse."""
    payload = json.dumps({"step": step, "status": status, "message": message})
    return f"data: {payload}\n\n"


async def emit(step: str, status: str, message: str) -> str:
    """Convenience coroutine — await and yield in one expression."""
    return sse_event(step, status, message)
