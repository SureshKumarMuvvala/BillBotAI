"""
backend/main.py  —  Chandra OCR Demo API  v3.0.0
─────────────────────────────────────────────────
Real Chandra OCR integration (Milestone 5).

Environment variables required:
    CHANDRA_API_KEY   — Datalab API key (from https://www.datalab.to/app/keys)

Frontend SSE contract is unchanged:
    data: {"step": "...", "status": "running|completed|failed", "message": "..."}

Steps emitted:
    upload  → convert  → extract  → preview  → excel
"""

import os
import uuid
import time
import asyncio
import logging
from typing import Dict

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from backend.services.chandra_convert  import run_convert, DatalabAPIError
from backend.services.chandra_extract  import run_extract
from backend.services.parser_service   import get_line_items, compute_quality_score
from backend.services.excel_service    import build_workbook
from backend.services.progress_service import sse_event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Chandra OCR Demo API",
    description="Real Chandra OCR integration via Datalab API — SSE progress streaming.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory job store ────────────────────────────────────────────────────────
JOBS: Dict[str, dict] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _get_api_key() -> str:
    key = os.environ.get("CHANDRA_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="CHANDRA_API_KEY environment variable not set. "
                   "Add it to your .env file or shell before starting the server.",
        )
    return key


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {"app": "Chandra OCR Demo API", "version": "3.0.0",
            "docs_url": "/docs", "status": "healthy"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Receive file, store bytes in job store, return job_id."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file uploaded")

    raw_bytes = await file.read()
    job_id    = str(uuid.uuid4())

    JOBS[job_id] = {
        "job_id":        job_id,
        "filename":      file.filename,
        "raw_bytes":     raw_bytes,
        "status":        "uploaded",
        "line_items":    [],
        "quality_score": None,
        "ocr_markdown":  "",
        "latency_sec":   0.0,
        "errors":        [],
    }
    logger.info("upload: job_id=%s  file=%s  bytes=%d", job_id, file.filename, len(raw_bytes))
    return {"job_id": job_id, "filename": file.filename, "status": "uploaded"}


@app.post("/process/{job_id}")
async def process_job(job_id: str):
    """Flag job as processing — actual work happens in the SSE stream."""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    JOBS[job_id]["status"] = "processing"
    return {
        "job_id":  job_id,
        "status":  "processing",
        "message": "Pipeline started. Stream progress via /progress/{job_id}",
    }


@app.get("/progress/{job_id}")
async def get_progress_stream(job_id: str):
    """
    SSE stream that runs the REAL Chandra OCR pipeline and emits JSON events.
    Frontend EventSource contract is fully preserved.
    """
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")

    job = JOBS[job_id]

    async def event_generator():
        api_key   = os.environ.get("CHANDRA_API_KEY", "")
        img_bytes = job["raw_bytes"]
        filename  = job["filename"]
        t_start   = time.time()

        try:
            # ── Stage 1: upload (already done — emit confirmation) ─────────────
            yield sse_event("upload", "running",   "Buffering invoice payload to processing queue…")
            await asyncio.sleep(0.3)
            yield sse_event("upload", "completed", f"File '{filename}' received — {len(img_bytes):,} bytes.")

            # ── Stage 2: convert ──────────────────────────────────────────────
            yield sse_event("convert", "running", "Submitting to Datalab /convert (layout tokenisation)…")
            convert_result = None
            quality_score  = None
            try:
                if not api_key or api_key == "your_datalab_api_key_here":
                    raise DatalabAPIError("CHANDRA_API_KEY is not configured in .env file.")
                convert_result = await run_convert(img_bytes, filename, api_key)
                quality_score  = compute_quality_score(convert_result)
                job["ocr_markdown"] = convert_result.get("markdown", "")
                score_str      = f"{quality_score}/5" if quality_score is not None else "—"
                yield sse_event("convert", "completed",
                                f"OCR conversion complete — quality score: {score_str}.")
            except DatalabAPIError as e:
                yield sse_event("convert", "failed", f"Convert error: {e}")
                # Non-fatal: continue to extract with whatever we have
                job["errors"].append(f"convert: {e}")

            # ── Stage 3: extract ──────────────────────────────────────────────
            yield sse_event("extract", "running",
                            "Submitting to Datalab /extract (schema-based field extraction)…")
            extract_result = None
            line_items     = []
            try:
                if not api_key or api_key == "your_datalab_api_key_here":
                    raise DatalabAPIError("CHANDRA_API_KEY is not configured in .env file.")
                extract_result = await run_extract(img_bytes, filename, api_key)
                line_items     = get_line_items(extract_result)
                yield sse_event("extract", "completed",
                                f"Extracted {len(line_items)} line item(s) successfully.")
            except DatalabAPIError as e:
                yield sse_event("extract", "failed", f"Extract error: {e}")
                job["errors"].append(f"extract: {e}")

            # ── Stage 4: preview ──────────────────────────────────────────────
            yield sse_event("preview", "running",  "Building structured preview matrix…")
            await asyncio.sleep(0.5)
            yield sse_event("preview", "completed",
                            f"Preview ready — {len(line_items)} row(s) assembled.")

            # ── Stage 5: excel ────────────────────────────────────────────────
            yield sse_event("excel", "running", "Compiling openpyxl workbook…")
            latency = time.time() - t_start

            # Persist results into job store so /download and /results can serve them
            job["line_items"]    = line_items
            job["quality_score"] = quality_score
            job["latency_sec"]   = latency
            job["status"]        = "completed"

            yield sse_event("excel", "completed",
                            f"Workbook compiled — {len(line_items)} items, "
                            f"quality {quality_score}/5, {latency:.1f}s total. "
                            "Finished. Structured data synchronized.")

        except asyncio.CancelledError:
            logger.info("SSE stream cancelled for job %s", job_id)
            job["status"] = "failed"

        except Exception as exc:
            logger.exception("Unhandled error in SSE stream for job %s", job_id)
            yield sse_event("excel", "failed", f"Unexpected error: {exc}")
            job["status"] = "failed"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/download/{job_id}")
async def download_excel(job_id: str):
    """Return the compiled openpyxl workbook as a downloadable .xlsx stream."""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")

    job = JOBS[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Extraction not yet finalised.")

    stream   = build_workbook(
        job_id        = job_id,
        filename      = job["filename"],
        line_items    = job["line_items"],
        quality_score = job["quality_score"],
        latency_sec   = job["latency_sec"],
    )
    fname = f"chandra_ocr_{job_id[:8]}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@app.get("/results/{job_id}")
async def get_results(job_id: str):
    """
    Return structured OCR results for the frontend preview panel.
    Available after pipeline completes (status == 'completed').
    """
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")

    job = JOBS[job_id]
    return {
        "job_id":        job_id,
        "filename":      job["filename"],
        "status":        job["status"],
        "line_items":    job["line_items"],
        "quality_score": job["quality_score"],
        "ocr_markdown":  job.get("ocr_markdown", ""),
        "latency_sec":   job["latency_sec"],
        "item_count":    len(job["line_items"]),
        "errors":        job["errors"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
