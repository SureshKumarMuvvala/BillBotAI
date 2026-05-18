import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_pipeline():
    print("--- 1. Testing POST /upload ---")
    files = {"file": ("test_invoice.pdf", b"mock pdf bytes content", "application/pdf")}
    r_upload = requests.post(f"{BASE_URL}/upload", files=files)
    print("Upload Status:", r_upload.status_code)
    upload_json = r_upload.json()
    print("Upload JSON:", upload_json)
    
    assert r_upload.status_code == 200
    assert "job_id" in upload_json
    job_id = upload_json["job_id"]
    
    print("\n--- 2. Testing POST /process/{job_id} ---")
    r_process = requests.post(f"{BASE_URL}/process/{job_id}")
    print("Process Status:", r_process.status_code)
    process_json = r_process.json()
    print("Process JSON:", process_json)
    
    assert r_process.status_code == 200
    assert process_json["status"] == "processing"
    
    print("\n--- 3. Testing GET /progress/{job_id} (SSE Stream) ---")
    r_progress = requests.get(f"{BASE_URL}/progress/{job_id}", stream=True)
    print("Progress connection established, reading stream...")
    
    for line in r_progress.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith("data: "):
                payload = json.loads(decoded_line[6:])
                print(f"SSE Event -> Step: {payload.get('step')}, Status: {payload.get('status')}, Msg: {payload.get('message')}")
                
    print("\n--- 4. Testing GET /download/{job_id} ---")
    r_download = requests.get(f"{BASE_URL}/download/{job_id}")
    print("Download Status:", r_download.status_code)
    print("Content-Type:", r_download.headers.get("content-type"))
    print("Content-Disposition:", r_download.headers.get("content-disposition"))
    
    assert r_download.status_code == 200
    assert "spreadsheet" in r_download.headers.get("content-type")
    print(f"Excel workbook payload size: {len(r_download.content)} bytes.")
    print("\nPipeline Successfully Verified! All systems operational.")

if __name__ == "__main__":
    test_pipeline()
