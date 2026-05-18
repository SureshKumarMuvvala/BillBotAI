"""
chandra_poll.py
───────────────
Shared synchronous polling loop extracted from the notebook _poll() helper.
Used by both chandra_convert and chandra_extract so there is a single source
of truth for the polling behaviour (rate-limit handling, timeout, retry).

Public API
----------
    data = poll_until_complete(check_url, headers, timeout, interval)
"""

import time
import logging
import requests
from typing import Dict, Any

logger = logging.getLogger(__name__)


class DatalabAPIError(Exception):
    pass


def poll_until_complete(
    check_url: str,
    headers:   dict,
    timeout:   int   = 180,
    interval:  float = 3,
) -> Dict[str, Any]:
    """
    Poll `check_url` until the response body contains ``status == 'complete'``
    or the timeout is exceeded.

    Copied verbatim from the notebook _poll() function; print() calls replaced
    by structured logging.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            resp = requests.get(check_url, headers=headers, timeout=15)

            if resp.status_code == 429:
                raise DatalabAPIError("Rate limit exceeded (429). Please wait and retry.")

            if resp.status_code != 200:
                raise DatalabAPIError(
                    f"Poll error [{resp.status_code}]: {resp.text[:200]}"
                )

            data   = resp.json()
            status = data.get("status", "")

            if status == "complete":
                logger.info("poll → complete ✅")
                return data

            elif status == "failed":
                logger.error("poll → failed ❌  error=%s", data.get("error"))
                raise DatalabAPIError(
                    f"Server extraction failed: {data.get('error', 'unknown')}"
                )

        except requests.exceptions.RequestException as e:
            # Transient network error — keep retrying (same as notebook)
            logger.warning("poll transient network error: %s", e)

        logger.debug("polling… (%.0fs remaining)", deadline - time.time())
        time.sleep(interval)

    raise DatalabAPIError(f"Timeout after {timeout}s waiting for OCR result.")
