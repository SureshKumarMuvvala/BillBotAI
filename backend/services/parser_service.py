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

# ── Allowed output fields — matches extract schema (order = final column order) ─
ALLOWED_FIELDS: List[str] = [
    "medicine_name",
    "batch_no",
    "expiry_date",
    "pack",
    "quantity",
    "free_quantity",
    "mrp",
    "rate",
    "mrp_per_tab",
    "rate_per_tab",
    "discount_percent",
    "gst_percent",
    "tax_amount",
    "amount",
    "barcode",
    "hsn_code",
]

# Numeric fields that need float coercion / safe cleaning
_NUMERIC_FIELDS: set = {
    "quantity", "free_quantity", "mrp", "rate",
    "mrp_per_tab", "rate_per_tab", "discount_percent",
    "gst_percent", "tax_amount", "amount",
}

# OCR noisy-header aliases → maps canonical field name → header variants
COLUMN_ALIASES: dict = {
    "medicine_name":    ["item", "product", "description", "drug name", "drug"],
    "batch_no":         ["batch", "batch no", "lot no", "lot"],
    "expiry_date":      ["expiry", "exp", "exp date", "exp."],
    "pack":             ["pack", "packing", "pack size"],
    "quantity":         ["qty", "quantity", "units"],
    "free_quantity":    ["free", "free qty", "bonus"],
    "mrp":              ["mrp", "m.r.p"],
    "rate":             ["rate", "price", "pur rate"],
    "mrp_per_tab":      ["mrp/tab", "mrp per tab", "unit mrp"],
    "rate_per_tab":     ["rate/tab", "rate per tab", "unit rate"],
    "discount_percent": ["disc", "discount", "disc%", "discount %"],
    "gst_percent":      ["gst", "igst", "tax%", "gst%"],
    "tax_amount":       ["tax", "tax rs", "tax amt", "tax amount"],
    "amount":           ["amount", "amt", "total", "net"],
    "barcode":          ["barcode", "ean", "ean code", "product code"],
    "hsn_code":         ["hsn", "hsn code", "sac"],
}


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

    if isinstance(raw, list):
        if len(raw) > 0 and isinstance(raw[0], dict):
            raw = raw[0]
        else:
            raw = {}

    return raw or {}


def parse_number(value) -> "float | None":
    """
    Safely convert a raw LLM / OCR value to float.

    Handles:
      - Already a float/int  → return as float
      - Strings with ₹, commas, % signs, whitespace (e.g. "₹1,234.50", "12%")
      - Empty string / None / non-parseable  → return None
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        return None
    # Strip common noise characters
    s = re.sub(r"[₹%,\s]", "", s)
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def parse_pack_units(pack: "str | None") -> "int | None":
    """
    Derive the number of consumable units in a pack string so we can
    calculate MRP/tab and Rate/tab automatically.

    Returns None for liquid / volume packs (ML, M suffix, L, MG, GM, MCG)
    because 'price per mL' is not meaningful for the MRP(PerTab) column.

    Supported formats (case-insensitive):
      "10x10"        → 100   (rows × tabs per row, e.g. 10 strips of 10 tabs)
      "1x10"         → 10
      "10S" / "15S"  → 10 / 15  (N sachets / strips)
      "10"           → 10   (plain unit count)
      "STRIP"        → 10   (standard 1×10 strip)
      "BOTTLE" / "VIAL" / "INJ" / "SYP" / "SYRUP" → None (liquid — skip)
      "100M" / "100ML" / "30ML" / "120M"           → None (volume — skip)
      None / unrecognised                           → None
    """
    if not pack:
        return None
    s = str(pack).strip().upper()

    # ── Liquid / volume pack suffixes: skip per-tab derivation ───────────────
    # Matches: 100M, 100ML, 30ML, 15ML, 120M, 200M, 2.5ML, 0.5ML, etc.
    if re.search(r"\d\s*(ML|MG|MCG|GM|GMS|G\b|L\b|M\b)", s):
        logger.debug("parse_pack_units: liquid/volume pack '%s' — skipping per-tab", pack)
        return None

    # Named liquid forms (without numeric suffix)
    for kw in ("BOTTLE", "VIAL", "SYP", "SYRUP", "DROPS", "SUSPENSION",
               "SOLUTION", "LOTION", "CREAM", "GEL", "OINTMENT", "INJ"):
        if kw in s:
            logger.debug("parse_pack_units: liquid form '%s' — skipping per-tab", pack)
            return None

    # ── Solid / discrete-unit packs ─────────────────────────────────────────

    # NxM pattern  e.g. "10X10", "1X10", "3X100", "10x10 TAB"
    m = re.match(r"^(\d+)\s*[Xx×]\s*(\d+)", s)
    if m:
        return int(m.group(1)) * int(m.group(2))

    # NS / S-suffix pattern  e.g. "15S", "10S", "30S" (N sachets/strips)
    m = re.match(r"^(\d+)\s*S\b", s)
    if m:
        return int(m.group(1))

    # Plain integer at the start  e.g. "10", "30 TABS", "100 CAPS"
    m = re.match(r"^(\d+)", s)
    if m:
        v = int(m.group(1))
        if v > 0:
            return v

    # Generic STRIP keyword → 10 tablets
    if "STRIP" in s:
        return 10

    # SACHET, AMP, TUBE — treat as single discrete unit
    for kw in ("SACHET", "AMP", "TUBE"):
        if kw in s:
            return 1

    return None


def derive_computed_values(item: dict) -> dict:
    """
    Auto-calculate derived fields when the LLM left them null.
    LLM-extracted values always win — this only fills None gaps.

    Derivations applied:
      mrp_per_tab   = mrp  / pack_units   (solid packs only; liquids skipped)
      rate_per_tab  = rate / pack_units
      tax_amount    = amount * gst_percent / 100
    """
    # ── Per-tab prices (solid pack only) ─────────────────────────────────────
    units = parse_pack_units(item.get("pack"))
    if units and units > 0:
        mrp  = item.get("mrp")
        rate = item.get("rate")
        if item.get("mrp_per_tab") is None and mrp is not None:
            item["mrp_per_tab"] = round(mrp / units, 4)
            logger.debug("derive: mrp_per_tab = %.4f / %d = %.4f",
                         mrp, units, item["mrp_per_tab"])
        if item.get("rate_per_tab") is None and rate is not None:
            item["rate_per_tab"] = round(rate / units, 4)
            logger.debug("derive: rate_per_tab = %.4f / %d = %.4f",
                         rate, units, item["rate_per_tab"])

    # ── Tax amount in rupees ──────────────────────────────────────────────────
    # Formula: tax_amount = amount × gst_percent / 100
    if item.get("tax_amount") is None:
        amount      = item.get("amount")
        gst_percent = item.get("gst_percent")
        if amount is not None and gst_percent is not None:
            item["tax_amount"] = round(amount * gst_percent / 100, 2)
            logger.debug("derive: tax_amount = %.4f × %.2f%% = %.2f",
                         amount, gst_percent, item["tax_amount"])

    return item



def clean_line_item(item: dict) -> dict:
    """
    Strip Chandra metadata fields (*_citations, *_score, etc.) and return
    only the 16 allowed schema fields.  Numeric fields are coerced via
    parse_number() so they are always float | None, regardless of what the
    LLM returned (string with ₹/%, OCR noise, etc.).

    String fields are preserved as-is; None is the safe default for every
    missing field so old invoices without the new columns stay backward-
    compatible.
    """
    out = {}
    for field in ALLOWED_FIELDS:
        raw = item.get(field)
        if field in _NUMERIC_FIELDS:
            out[field] = parse_number(raw)
        else:
            # String / text fields: keep as-is or None
            out[field] = raw if raw not in ("", [], {}) else None
    return out


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

    # Derive mrp_per_tab / rate_per_tab / tax_amount from available fields when LLM left them null
    derived = [derive_computed_values(item) for item in cleaned]

    # Deduplicate adjacent identical rows (common LLM hallucination at end of tables)
    deduped = []
    for item in derived:
        if not deduped or deduped[-1] != item:
            deduped.append(item)

    logger.info("get_line_items: %d item(s) extracted", len(deduped))
    return deduped


def compute_quality_score(convert_result: dict) -> Any:
    """
    Pull parse_quality_score from a convert result.
    Returns None if convert was not run or score is absent.
    """
    if not convert_result:
        return None
    return convert_result.get("parse_quality_score")
