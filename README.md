# Chandra OCR Demo Application

A full-stack, layout-aware OCR extraction and visualization system featuring real-time execution streaming via Server-Sent Events (SSE).

## Tech Stack

- **Backend**: FastAPI + Uvicorn + Server-Sent Events (SSE)
- **Frontend**: React + Vite + Tailwind CSS + Axios
- **Communication**: REST APIs (for file uploads) and SSE (for real-time pipeline event logging)

---

## Project Structure

```
d:\BillBotAI/
├── requirements.txt            # Python dependencies
├── README.md                   # Setup and execution instructions
├── venv/                       # Local Python virtual environment
├── backend/                    # FastAPI source files
│   ├── main.py                 # FastAPI application and CORS configuration
│   ├── routes/
│   │   └── ocr.py              # REST & SSE stream endpoints
│   └── services/
│       └── ocr_service.py      # Stubbed OCR extraction pipeline and SSE generator
└── frontend/                   # React web client
    ├── tailwind.config.js      # Tailwind v3 layout settings
    ├── postcss.config.js       # PostCSS processor settings
    └── src/
        ├── App.jsx             # Beautiful glassmorphic dashboard
        ├── main.jsx            # React root mount
        ├── index.css           # Tailwind base styles and glow effects
        └── components/
            ├── FileUploader.jsx      # High-fidelity file drop/selection panel
            ├── LogConsole.jsx        # real-time SSE streaming terminal output
            └── ResultsViewer.jsx     # Extracted OCR structure, bounding box, confidence heatmap, & JSON viewers
```

---

## Backend Setup & Virtual Environment (venv)

Please perform these steps in the root directory:

### 1. Create Python Virtual Environment
Run this command from the project root:
```bash
python -m venv venv
```

### 2. Activate the Virtual Environment
Activate according to your shell and operating system:

* **Windows Command Prompt (cmd.exe)**:
  ```cmd
  venv\Scripts\activate.bat
  ```

* **Windows PowerShell**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  *(Note: If you get a policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first)*

* **macOS / Linux (bash/zsh)**:
  ```bash
  source venv/bin/activate
  ```

### 3. Install Dependencies
Ensure the virtual environment is activated, then run:
```bash
pip install -r requirements.txt
```

### 4. Run the Backend Server
Start the FastAPI server using Uvicorn:
```bash
uvicorn backend.main:app --reload --port 8000
```
The API documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Frontend Setup

Ensure you have [Node.js](https://nodejs.org/) installed, then navigate into the `frontend` folder and follow these steps:

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The frontend application will be running at: [http://localhost:5173](http://localhost:5173).

---

## Real-Time Architecture (SSE Pipeline)

1. The frontend uploads an invoice image/PDF via a `POST /api/ocr/upload` request.
2. The backend generates a unique `task_id` and starts a mock background processing sequence.
3. The frontend establishes an SSE connection with `/api/ocr/stream/{task_id}`.
4. The backend streams step-by-step progress events (`Layout Analysis`, `Bounding Box Regressions`, `Token Assembly`, etc.) directly to the frontend `LogConsole`.
5. Upon completion, the finalized JSON document is sent over the SSE connection and rendered instantly inside the `ResultsViewer` dashboard!
