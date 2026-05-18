from fastapi import APIRouter, UploadFile, File, HTTPException
from sse_starlette.sse import EventSourceResponse
from backend.services.ocr_service import ocr_service

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Receives an invoice file (image/PDF) and creates a mock OCR extraction task.
    Returns the task_id to connect via Server-Sent Events (SSE).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Create the task
    task_id = ocr_service.create_task(file.filename)
    
    return {
        "status": "success",
        "task_id": task_id,
        "filename": file.filename,
        "message": "Task initialized successfully. Establish an SSE connection to stream updates."
    }

@router.get("/stream/{task_id}")
async def stream_ocr_events(task_id: str):
    """
    Establishes a Server-Sent Events (SSE) stream for real-time progress logging
    of the specified task_id.
    """
    task = ocr_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    generator = ocr_service.simulate_ocr_pipeline(task_id)
    return EventSourceResponse(generator)

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Retrieves the static status of the OCR task.
    """
    task = ocr_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
