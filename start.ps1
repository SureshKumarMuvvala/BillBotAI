# Chandra OCR Demo — local development startup
# Usage:  .\start.ps1
# Requires: Python venv already created at .\venv\

$ErrorActionPreference = "Stop"

$ROOT    = $PSScriptRoot
$VENV    = "$ROOT\venv\Scripts"
$PYTHON  = "$VENV\python.exe"
$UVICORN = "$VENV\uvicorn.exe"
$FRONT   = "$ROOT\frontend"

# ── Check venv ────────────────────────────────────────────────────────────────
if (-not (Test-Path $PYTHON)) {
    Write-Error "venv not found at $VENV. Create it first:  python -m venv venv"
    exit 1
}

# ── Check .env ────────────────────────────────────────────────────────────────
if (-not (Test-Path "$ROOT\.env")) {
    Write-Warning ".env file not found — copying from .env.example"
    Copy-Item "$ROOT\.env.example" "$ROOT\.env"
}

# ── Install / upgrade dependencies silently ───────────────────────────────────
Write-Host ">>> Syncing backend dependencies..." -ForegroundColor Cyan
& $PYTHON -m pip install -q -r "$ROOT\requirements.txt"

# ── Launch FastAPI in background ──────────────────────────────────────────────
Write-Host ">>> Starting backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($py, $root)
    Set-Location $root
    & $py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
} -ArgumentList $PYTHON, $ROOT

Start-Sleep -Seconds 3
Write-Host ">>> Backend PID: $($backendJob.Id)" -ForegroundColor Green

# ── Launch Vite dev server ────────────────────────────────────────────────────
Write-Host ">>> Starting frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Set-Location $FRONT
cmd /c "npm run dev"

# ── On exit: clean up backend job ────────────────────────────────────────────
Stop-Job $backendJob
Remove-Job $backendJob
