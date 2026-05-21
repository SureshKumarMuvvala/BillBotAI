"""
chandra_convert.py
──────────────────
Calls the Datalab /api/v1/convert endpoint (full markdown + JSON conversion).
Extracted verbatim from the notebook api-client cell; all Colab-specific
print() calls have been replaced by a logger instance so they work in FastAPI.

Public API
----------
    result = await run_convert(img_bytes, filename, api_key)

Returns the completed poll-response dict:
    {
        "markdown":            str,
        "json":                list[dict],
        "page_count":          int,
        "parse_quality_score": float | None,
        ...
    }
"""

import io
import time
import logging
import asyncio
from typing import Dict, Any

import requests
from PIL import Image

from .chandra_poll import poll_until_complete, DatalabAPIError

logger = logging.getLogger(__name__)

BASE_URL = "https://www.datalab.to/api/v1"

# ── Config (mirrors notebook POLL_INTERVAL_SEC / TIMEOUT_SEC) ─────────────────
CONVERT_MODE   = "accurate"
OUTPUT_FORMAT  = "markdown,json"
POLL_INTERVAL  = 3      # seconds
TIMEOUT_SEC    = 180    # max wait


# ── Internal helpers (copied from notebook) ───────────────────────────────────
def _to_jpeg(raw_bytes: bytes, filename: str) -> bytes:
    """Normalise any PIL-supported image to JPEG for the API."""
    try:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        return buf.getvalue()
    except Exception as e:
        raise DatalabAPIError(f"Cannot decode image '{filename}': {e}")


def _call_convert_sync(
    img_bytes: bytes,
    filename:  str,
    api_key:   str,
    output_format: str = OUTPUT_FORMAT,
    mode:          str = CONVERT_MODE,
    timeout:       int = TIMEOUT_SEC,
    interval:    float = POLL_INTERVAL,
) -> Dict[str, Any]:
    """
    Synchronous version — called from the async wrapper below.
    Mirrors notebook call_convert() exactly.
    """
    headers = {"X-API-Key": api_key}
    jpeg    = _to_jpeg(img_bytes, filename)

    logger.info("[convert] Submitting %s …", filename)
    resp = requests.post(
        f"{BASE_URL}/convert",
        headers=headers,
        files={"file": ("image.jpg", jpeg, "image/jpeg")},
        data={"output_format": output_format, "mode": mode},
        timeout=30,
    )

    if resp.status_code == 429:
        raise DatalabAPIError("Rate limit exceeded on convert submit.")
    if resp.status_code != 200:
        raise DatalabAPIError(f"Convert submit failed [{resp.status_code}]: {resp.text[:300]}")

    check_url = resp.json().get("request_check_url")
    if not check_url:
        raise DatalabAPIError("No request_check_url in convert submit response.")

    logger.info("[convert] Polling %s …", check_url)
    return poll_until_complete(check_url, headers, timeout, interval)


# ── Public async entry-point ──────────────────────────────────────────────────
async def run_convert(
    img_bytes: bytes,
    filename:  str,
    api_key:   str,
) -> Dict[str, Any]:
    """
    Async wrapper: runs the blocking HTTP calls in a thread-pool executor so
    the FastAPI event loop stays responsive during the Datalab polling loop.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        _call_convert_sync,
        img_bytes,
        filename,
        api_key,
    )
    return result
