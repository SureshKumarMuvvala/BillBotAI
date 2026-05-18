import asyncio
import uuid
import time
import json
from typing import Dict, Any, AsyncGenerator

class OCRService:
    def __init__(self):
        # In-memory store for demo task states
        self.tasks: Dict[str, Dict[str, Any]] = {}

    def create_task(self, filename: str) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "task_id": task_id,
            "filename": filename,
            "status": "PENDING",
            "progress": 0,
            "logs": [],
            "created_at": time.time(),
            "result": None
        }
        return task_id

    def get_task(self, task_id: str) -> Dict[str, Any]:
        return self.tasks.get(task_id, {})

    async def simulate_ocr_pipeline(self, task_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Simulates an 8-stage layout-aware OCR processing pipeline.
        Yields events formatted as dictionaries for sse-starlette's EventSourceResponse.
        """
        task = self.get_task(task_id)
        if not task:
            yield {
                "event": "error",
                "data": json.dumps({"message": "Task not found"})
            }
            return

        task["status"] = "PROCESSING"
        
        stages = [
            (10, "Stage 1: Validating file format and structure..."),
            (25, "Stage 2: Aligning layout and deskewing document pages..."),
            (40, "Stage 3: Running layout-aware region segmentation..."),
            (55, "Stage 4: Executing Chandra OCR Token Extraction..."),
            (70, "Stage 5: Detecting tabular bands and product columns..."),
            (80, "Stage 6: Assembling invoice rows via Product-Anchored strategy..."),
            (90, "Stage 7: Validating totals, tax ratios, and mathematical coherence..."),
            (100, "Stage 8: Finalizing structured schema serialization...")
        ]

        for progress, log_message in stages:
            await asyncio.sleep(0.8)  # Pause to simulate processing time
            task["progress"] = progress
            task["logs"].append(log_message)
            
            # Yield SSE progress event as dictionary
            yield {
                "event": "progress",
                "data": json.dumps({
                    "progress": progress,
                    "message": log_message
                })
            }

        # Mock structured OCR result tailored for a pharmacy invoice
        mock_result = {
            "invoice_metadata": {
                "vendor_name": "APOLLO PHARMACEUTICAL DISTRIBUTORS",
                "invoice_number": "TX-9988221",
                "invoice_date": "2026-05-15",
                "total_amount": 1385.00,
                "gstin": "33AACCA1234F1Z9"
            },
            "line_items": [
                {
                    "product_name": "PARACETAMOL 650MG",
                    "batch_no": "PM8901",
                    "expiry_date": "12/2028",
                    "qty": 50,
                    "mrp": 30.00,
                    "rate": 12.50,
                    "gst_percent": 12,
                    "amount": 625.00,
                    "confidence": 0.99
                },
                {
                    "product_name": "AMOXYCILLIN 500MG",
                    "batch_no": "AM4412",
                    "expiry_date": "08/2027",
                    "qty": 20,
                    "mrp": 75.00,
                    "rate": 32.00,
                    "gst_percent": 18,
                    "amount": 640.00,
                    "confidence": 0.95
                },
                {
                    "product_name": "CETIRIZINE 10MG",
                    "batch_no": "CT1003",
                    "expiry_date": "03/2029",
                    "qty": 15,
                    "mrp": 15.00,
                    "rate": 8.00,
                    "gst_percent": 12,
                    "amount": 120.00,
                    "confidence": 0.92
                }
            ],
            "tax_summary": {
                "cgst_6_percent": 44.70,
                "sgst_6_percent": 44.70,
                "cgst_9_percent": 57.60,
                "sgst_9_percent": 57.60,
                "total_tax": 204.60
            },
            "ocr_performance": {
                "total_tokens_extracted": 348,
                "average_confidence": 0.965,
                "processing_time_seconds": 6.4,
                "chandra_api_calls": 1
            }
        }

        task["status"] = "SUCCESS"
        task["result"] = mock_result

        # Yield SSE final success event
        yield {
            "event": "completed",
            "data": json.dumps(mock_result)
        }

# Singleton service instance
ocr_service = OCRService()
