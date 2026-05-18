"""
batch_process.py
Processes all invoice images in the invoices/ folder sequentially through
the Chandra OCR API. For each invoice:
  1. POST /upload
  2. POST /process/{job_id}
  3. Stream GET /progress/{job_id} until 'Finished'
  4. GET /download/{job_id} -> save to "Excel Downloads/<invoice_stem>.xlsx"
  5. GET /results/{job_id}  -> print summary

Usage (from project root in venv):
  venv\\Scripts\\python.exe docs/Testing/batch_process.py
"""

import sys, time, json, pathlib, requests, io

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

API   = "http://localhost:8000"
ROOT  = pathlib.Path(__file__).parent.parent.parent   # d:\\BillBotAI
IMGS  = sorted((ROOT / "invoices").glob("*.jpeg")) + \
        sorted((ROOT / "invoices").glob("*.jpg"))  + \
        sorted((ROOT / "invoices").glob("*.png"))
OUT   = ROOT / "Excel Downloads"
OUT.mkdir(exist_ok=True)

SEP = "-" * 72

def stream_progress(job_id: str) -> bool:
    """Stream SSE and return True when pipeline completes successfully."""
    url  = f"{API}/progress/{job_id}"
    resp = requests.get(url, stream=True, timeout=300)
    for raw in resp.iter_lines():
        if not raw or not raw.startswith(b"data:"):
            continue
        payload = json.loads(raw[5:].strip())
        step, status, msg = payload["step"], payload["status"], payload["message"]
        icon = {"running": "[RUN]", "completed": "[OK] ", "failed": "[ERR]"}.get(status, "     ")
        print(f"  {icon}  [{step:7s}] {status:10s}  {msg}")
        if step == "excel" and status == "completed" and "Finished" in msg:
            return True
        if status == "failed" and step == "upload":
            return False
    return False

def download_excel(job_id: str, stem: str) -> pathlib.Path:
    resp = requests.get(f"{API}/download/{job_id}", timeout=60)
    resp.raise_for_status()
    out_path = OUT / f"{stem}.xlsx"
    out_path.write_bytes(resp.content)
    return out_path

def fetch_summary(job_id: str) -> dict:
    try:
        return requests.get(f"{API}/results/{job_id}", timeout=30).json()
    except Exception:
        return {}

def main():
    if not IMGS:
        print("❌  No invoice images found in invoices/"); sys.exit(1)

    print(f"\n{'CHANDRA OCR BATCH PROCESSOR':^72}")
    print(SEP)
    print(f"  Invoices : {len(IMGS)}")
    print(f"  Output   : {OUT}")
    print(SEP)

    results_log = []

    for idx, img_path in enumerate(IMGS, 1):
        stem = img_path.stem        # e.g. "G1"
        print(f"\n[{idx}/{len(IMGS)}] Processing: {img_path.name}")
        print(SEP)

        # 1. Upload
        t0 = time.perf_counter()
        with open(img_path, "rb") as fh:
            up = requests.post(f"{API}/upload",
                               files={"file": (img_path.name, fh, "image/jpeg")},
                               timeout=30)
        up.raise_for_status()
        job_id = up.json()["job_id"]
        print(f"  >> Uploaded  ->  job_id: {job_id[:16]}...")

        # 2. Trigger processing
        requests.post(f"{API}/process/{job_id}", timeout=15).raise_for_status()
        print("  >> Pipeline started -- streaming progress...\n")

        # 3. Stream SSE
        ok = stream_progress(job_id)
        elapsed = time.perf_counter() - t0

        # 4. Download Excel
        if ok:
            out_path = download_excel(job_id, stem)
            print(f"\n  [SAVED]  Excel saved -> {out_path.relative_to(ROOT)}")
        else:
            print("\n  [WARN]   Pipeline did not complete -- skipping download.")
            out_path = None

        # 5. Summary
        res = fetch_summary(job_id)
        items   = len(res.get("line_items", []))
        quality = res.get("quality_score")
        errors  = res.get("errors", [])

        print(f"  [INFO]   Items: {items}  |  Quality: {quality}/5  |  Elapsed: {elapsed:.1f}s")
        if errors:
            print(f"  [WARN]   Errors: {'; '.join(str(e) for e in errors[:3])}")

        results_log.append({
            "invoice": img_path.name,
            "job_id":  job_id,
            "items":   items,
            "quality": quality,
            "elapsed": round(elapsed, 1),
            "excel":   str(out_path.relative_to(ROOT)) if out_path else None,
            "errors":  errors,
        })

        print(SEP)

    # Final summary table
    print(f"\n{'BATCH COMPLETE -- SUMMARY':^72}")
    print(SEP)
    print(f"  {'Invoice':<12} {'Items':>6} {'Quality':>9} {'Time':>7}  Excel")
    print(f"  {'-'*12} {'-'*6} {'-'*9} {'-'*7}  {'-'*30}")
    for r in results_log:
        qual_str = f"{r['quality']}/5" if r["quality"] is not None else "  -"
        print(f"  {r['invoice']:<12} {r['items']:>6} {qual_str:>9} {r['elapsed']:>6.1f}s  {r['excel'] or '(skipped)'}")
    print(SEP)
    print()

if __name__ == "__main__":
    main()
