"""
parser_service.py
─────────────────
Normalises raw Chandra API responses into clean, schema-valid line-item dicts.

Extracted from the notebook preview-data cell (get_extracted_fields &
clean_line_item helpers).  The display()/HTML() calls have been removed;
this module is pure-Python and FastAPI-compatible.

Public API
----------
    items  = get_line_items(extract_result)   → list[dict]
    item   = clean_line_item(raw_item)        → dict
    fields = get_extracted_fields(result)     → dict
"""

import json
import re
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# ── Allowed output fields — matches prompt extraction schema ──────────────────
ALLOWED_FIELDS: List[str] = [
    "medicine_name",
    "batch_no",
    "expiry_date",
    "quantity",
    "free_quantity",
    "rate",
    "mrp",
    "gst_percent",
    "amount",
    "hsn_code",
]


def get_extracted_fields(result: dict) -> dict:
    """
    Safely normalise the Chandra extract response.

    Supports three formats observed in the notebook:
      1. Direct ``{"items": [...]}``
      2. ``extraction_schema_json`` as dict
      3. ``extraction_schema_json`` as JSON string (possibly with markdown fences)

    Copied verbatim from notebook get_extracted_fields(); no Colab deps.
    """
    # Format 1 — direct items already present
    if "items" in result:
        return result

    raw: Any = result.get("extraction_schema_json", {})

    if isinstance(raw, str):
        raw = raw.strip()
        # Strip markdown code fences (```json … ```)
        raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        try:
            return json.loads(raw)
        except Exception:
            logger.warning("get_extracted_fields: failed to parse JSON string")
            return {}

    return raw or {}


def clean_line_item(item: dict) -> dict:
    """
    Strip Chandra metadata fields (*_citations, *_score, etc.) and return
    only the 10 allowed schema fields.

    Copied verbatim from notebook clean_line_item().
    """
    return {field: item.get(field) for field in ALLOWED_FIELDS}


def get_line_items(extract_result: dict) -> List[dict]:
    """
    High-level helper: parse an extract API response and return a list of
    clean line-item dicts ready for the Excel generator or JSON response.

    Returns an empty list (not an exception) when no items are found so the
    pipeline can emit a graceful quality event.
    """
    if not extract_result:
        return []

    fields     = get_extracted_fields(extract_result)
    raw_items  = fields.get("items", [])

    if not isinstance(raw_items, list):
        logger.warning("get_line_items: 'items' is not a list — got %s", type(raw_items))
        return []

    cleaned = [clean_line_item(item) for item in raw_items]
    logger.info("get_line_items: %d item(s) extracted", len(cleaned))
    return cleaned


def compute_quality_score(convert_result: dict) -> Any:
    """
    Pull parse_quality_score from a convert result.
    Returns None if convert was not run or score is absent.
    """
    if not convert_result:
        return None
    return convert_result.get("parse_quality_score")
