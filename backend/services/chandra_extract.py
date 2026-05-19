"""
chandra_extract.py
──────────────────
Calls the Datalab /api/v1/extract endpoint (schema-based structured extraction).
Extracted from the notebook api-client cell.

Public API
----------
    result = await run_extract(img_bytes, filename, api_key)

Returns the completed poll-response dict.
The caller (parser_service) then calls get_line_items(result) to decode items.
"""

import io
import logging
import asyncio
import json
from typing import Dict, Any

import requests
from PIL import Image

from .chandra_poll import poll_until_complete, DatalabAPIError

logger = logging.getLogger(__name__)

BASE_URL      = "https://www.datalab.to/api/v1"
CONVERT_MODE  = "accurate"
POLL_INTERVAL = 3
TIMEOUT_SEC   = 180

# ── Extraction schema — extended with Pack, MRP/Tab, Rate/Tab, Disc, Tax₹, Barcode ──
EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "description": "List of GRN medicine line items",
            "items": {
                "type": "object",
                "properties": {
                    "medicine_name":    {"type": "string",          "description": "Medicine / product name (columns: Item, Product, Description, Drug Name)"},
                    "batch_no":         {"type": ["string", "null"], "description": "Batch number (columns: Batch, Batch No, Lot No)"},
                    "expiry_date":      {"type": ["string", "null"], "description": "Expiry date (columns: Expiry, Exp, Exp Date, EXP)"},
                    "pack":             {"type": ["string", "null"], "description": "Pack size / form e.g. 10x10, 1x10, STRIP, BOX, BOTTLE (columns: Pack, Packing, Pack Size)"},
                    "quantity":         {"type": ["number", "null"], "description": "Quantity / units ordered (columns: Qty, Quantity, Units)"},
                    "free_quantity":    {"type": ["number", "null"], "description": "Free / bonus units (columns: Free, Free Qty, Bonus)"},
                    "mrp":              {"type": ["number", "null"], "description": "MRP per pack in rupees (columns: MRP, M.R.P)"},
                    "rate":             {"type": ["number", "null"], "description": "Purchase rate per pack in rupees (columns: Rate, Price, Pur Rate)"},
                    "mrp_per_tab":      {"type": ["number", "null"], "description": "MRP per tablet/unit (columns: MRP/Tab, MRP Per Tab, Unit MRP)"},
                    "rate_per_tab":     {"type": ["number", "null"], "description": "Rate per tablet/unit (columns: Rate/Tab, Rate Per Tab, Unit Rate)"},
                    "discount_percent": {"type": ["number", "null"], "description": "Discount percentage off MRP (columns: Disc, Discount, Disc%, Discount %)"},
                    "gst_percent":      {"type": ["number", "null"], "description": "Total GST percent. If CGST+SGST are separate, add them (e.g. 6%+6%=12). Columns: GST, IGST, Tax%"},
                    "tax_amount":       {"type": ["number", "null"], "description": "Tax amount in rupees (columns: Tax, Tax Rs, Tax Amt, Tax Amount)"},
                    "amount":           {"type": ["number", "null"], "description": "Final line total in rupees (columns: Amount, Amt, Total, Net)"},
                    "barcode":          {"type": ["string", "null"], "description": "Barcode or EAN / product code (columns: Barcode, EAN, EAN Code, Product Code)"},
                    "hsn_code":         {"type": ["string", "null"], "description": "HSN / SAC code (columns: HSN, HSN Code, SAC)"},
                },
                "required": ["medicine_name"],
            },
        }
    },
    "required": ["items"],
}


# ── Internal JPEG normaliser (shared pattern from notebook) ───────────────────
def _to_jpeg(raw_bytes: bytes, filename: str) -> bytes:
    try:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        return buf.getvalue()
    except Exception as e:
        raise DatalabAPIError(f"Cannot decode image '{filename}': {e}")


# ── Synchronous call (mirrors notebook call_extract) ─────────────────────────
def _call_extract_sync(
    img_bytes: bytes,
    filename:  str,
    api_key:   str,
    schema:    dict = None,
    mode:      str  = CONVERT_MODE,
    timeout:   int  = TIMEOUT_SEC,
    interval:  float = POLL_INTERVAL,
) -> Dict[str, Any]:
    """
    Synchronous version — called from the async wrapper below.
    Mirrors notebook call_extract() exactly.
    """
    if schema is None:
        schema = EXTRACT_SCHEMA

    headers = {"X-API-Key": api_key}
    jpeg    = _to_jpeg(img_bytes, filename)

    logger.info("[extract] Submitting %s …", filename)
    resp = requests.post(
        f"{BASE_URL}/extract",
        headers=headers,
        files={"file": ("image.jpg", jpeg, "image/jpeg")},
        data={"page_schema": json.dumps(schema), "mode": mode, "output_format": "json"},
        timeout=30,
    )

    if resp.status_code == 429:
        raise DatalabAPIError("Rate limit exceeded on extract submit.")
    if resp.status_code != 200:
        raise DatalabAPIError(
            f"Extract submit failed [{resp.status_code}]: {resp.text[:300]}"
        )

    check_url = resp.json().get("request_check_url")
    if not check_url:
        raise DatalabAPIError("No request_check_url in extract submit response.")

    logger.info("[extract] Polling %s …", check_url)
    return poll_until_complete(check_url, headers, timeout, interval)


# ── Public async entry-point ──────────────────────────────────────────────────
async def run_extract(
    img_bytes: bytes,
    filename:  str,
    api_key:   str,
) -> Dict[str, Any]:
    """
    Async wrapper: runs blocking HTTP + polling in a thread-pool executor so
    the FastAPI event loop stays free.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        _call_extract_sync,
        img_bytes,
        filename,
        api_key,
    )
