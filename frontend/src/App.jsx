import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Layers, Database, Sparkles, AlertTriangle } from 'lucide-react';
import UploadPanel from './components/UploadPanel';
import ProgressPanel from './components/ProgressPanel';

const INITIAL_STEPS = [
  { key: 'upload', name: 'Upload File', status: 'idle', duration: 0, description: 'Awaiting invoice payload transfer to backend...' },
  { key: 'convert', name: 'Convert OCR', status: 'idle', duration: 0, description: 'Awaiting Chandra layout-aware tokenization...' },
  { key: 'extract', name: 'Extract Structured Data', status: 'idle', duration: 0, description: 'Awaiting schema parser extraction mapping...' },
  { key: 'preview', name: 'Build Preview', status: 'idle', duration: 0, description: 'Awaiting layout preview matrix construction...' },
  { key: 'excel', name: 'Generate Excel', status: 'idle', duration: 0, description: 'Awaiting openpyxl compiled Workbook generation...' }
];

export default function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExcelReady, setIsExcelReady] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, running, completed, failed
  
  // Pipeline steps state
  const [steps, setSteps] = useState(INITIAL_STEPS);
  
  // Track active job reference
  const [jobId, setJobId] = useState(null);
  
  // Timer references
  const timerRef = useRef(null);
  const activeStepRef = useRef(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleClearFile = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFile(null);
    setIsProcessing(false);
    setIsExcelReady(false);
    setStatus('idle');
    setSteps(INITIAL_STEPS);
    setJobId(null);
    activeStepRef.current = null;
  };

  const handleFileSelect = (selectedFile) => {
    handleClearFile();
    setFile(selectedFile);
  };

  // Live progress duration clock runner
  const startLocalStepTimer = (stepKey) => {
    if (timerRef.current) clearInterval(timerRef.current);
    activeStepRef.current = stepKey;
    
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds += 1;
      setSteps(prev => prev.map(s => s.key === stepKey ? { ...s, duration: seconds } : s));
    }, 1000);
  };

  const stopLocalStepTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Connected Full-stack Processing Pipeline Flow
  const startProcessing = async () => {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setStatus('running');
    setIsExcelReady(false);
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle', duration: 0 })));

    try {
      // 1. Upload file using Axios (multipart/form-data)
      const formData = new FormData();
      if (file.name === 'sample_pharmacy_invoice.pdf' && file.size === 1048576) {
        // Construct a mock Blob if it's the demo file injection
        const mockBlob = new Blob(['demo content'], { type: 'application/pdf' });
        formData.append('file', mockBlob, file.name);
      } else {
        formData.append('file', file);
      }

      const uploadResponse = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { job_id } = uploadResponse.data;
      setJobId(job_id);

      // 2. Trigger simulated process queue
      await axios.post(`http://localhost:8000/process/${job_id}`);

      // 3. Establish SSE connection using native EventSource
      const eventSource = new EventSource(`http://localhost:8000/progress/${job_id}`);

      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const { step, status: stepStatus, message } = payload;

        setSteps(prevSteps => {
          return prevSteps.map(s => {
            if (s.key === step) {
              // Trigger or stop step duration timers
              if (stepStatus === 'running' && activeStepRef.current !== step) {
                startLocalStepTimer(step);
              } else if (stepStatus === 'completed' && activeStepRef.current === step) {
                stopLocalStepTimer();
              }
              
              return { 
                ...s, 
                status: stepStatus, 
                description: message 
              };
            }
            // Mark previously active steps as completed if they are skipped or not caught
            const currentIdx = INITIAL_STEPS.findIndex(x => x.key === step);
            const thisIdx = INITIAL_STEPS.findIndex(x => x.key === s.key);
            if (thisIdx < currentIdx && s.status !== 'completed') {
              return { ...s, status: 'completed' };
            }
            return s;
          });
        });

        // Check if finished (completed final stage "excel")
        if (step === 'excel' && stepStatus === 'completed' && message.includes("Finished")) {
          stopLocalStepTimer();
          eventSource.close();
          setIsProcessing(false);
          setStatus('completed');
          setIsExcelReady(true);
        }
      };

      eventSource.onerror = (err) => {
        stopLocalStepTimer();
        eventSource.close();
        
        // Flag currently active step to failed
        setSteps(prev => prev.map(s => s.key === activeStepRef.current ? { ...s, status: 'failed', description: 'SSE stream connection lost or interrupted.' } : s));
        setIsProcessing(false);
        setStatus('failed');
      };

    } catch (error) {
      stopLocalStepTimer();
      setIsProcessing(false);
      setStatus('failed');
      
      // Mark first step (upload) as failed
      setSteps(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: 'failed', description: error.message || 'REST connection failed.' } : s));
      alert(`Backend Connection Error: ${error.message || 'Server is not running or rejected request.'}`);
    }
  };

  const handleDownloadExcel = () => {
    if (!jobId) return;
    // Direct link to dynamic binary spreadsheet download
    window.location.href = `http://localhost:8000/download/${jobId}`;
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-sans relative">
      {/* Visual glowing neon backing circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main App Block */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col justify-start z-10">
        
        {/* Navigation / Brand Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center rounded-xl glow-accent">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-sans">CHANDRA</h1>
                <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded border border-cyan-500/20">
                  LAYOUT OCR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Mock Layout-Aware Scaffolding Sandbox</p>
            </div>
          </div>

          {/* Active API Connectivity Gateway Badge */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gateway State:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                API PORT 8000 ACTIVE
              </span>
            </div>
          </div>
        </header>

        {/* Info Notification bar */}
        <div className="mb-6 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
          <Database className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Connected Mode:</strong> The web client is actively connected to the FastAPI server at <code>http://localhost:8000</code> using Axios uploads and EventSource SSE streams.
          </span>
        </div>

        {/* Master Workspace Split-screen Flexbox */}
        <main className="flex flex-col lg:flex-row gap-6 items-stretch flex-1">
          {/* Left Control Panel (35% Width Ratio) */}
          <div className="w-full lg:w-[35%] flex flex-col">
            <UploadPanel
              file={file}
              onFileSelect={handleFileSelect}
              onClearFile={handleClearFile}
              isProcessing={isProcessing}
              status={status}
              onStartProcessing={startProcessing}
              onDownloadExcel={handleDownloadExcel}
              isExcelReady={isExcelReady}
            />
          </div>

          {/* Right Progress Stepper Panel (65% Width Ratio) */}
          <div className="w-full lg:w-[65%] flex flex-col flex-1">
            <ProgressPanel steps={steps} />
          </div>
        </main>
      </div>

      {/* Footer copyright and versioning */}
      <footer className="text-center text-[10px] text-slate-600 font-mono mt-12">
        <p>© 2026 Chandra Layout Extractor. Connected Live Stack V2.0.0.</p>
      </footer>
    </div>
  );
}
