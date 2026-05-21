/**
 * App.jsx — layout shell only.
 * All pipeline state and side-effects live in usePipeline().
 */

import React, { useState, useEffect, memo } from 'react';
import { Layers, Database, Sparkles, Cpu, Activity } from 'lucide-react';

import { usePipeline }     from './hooks/usePipeline';
import { ErrorBoundary }   from './components/ErrorBoundary';
import UploadPanel         from './components/UploadPanel';
import ProgressPanel       from './components/ProgressPanel';
import OCRResultsPanel     from './components/OCRResultsPanel';
import Toaster             from './components/Toaster';
import { APP_VERSION, API_BASE_URL } from './config/constants';

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { Icon: Cpu,      active: true,  title: 'OCR Pipeline' },
  { Icon: Activity, active: false, title: 'Analytics'    },
  { Icon: Database, active: false, title: 'Data Store'   },
];

// ── Memoised sub-components to prevent unnecessary re-renders ─────────────────
const StatusPill = memo(function StatusPill({ isProcessing, status }) {
  const cfg = isProcessing
    ? { cls: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',     dot: 'bg-cyan-400 animate-pulse', label: 'PROCESSING' }
    : status === 'completed'
    ? { cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400',       label: 'COMPLETED'  }
    : status === 'failed'
    ? { cls: 'bg-rose-500/10 border-rose-500/20 text-rose-400',     dot: 'bg-rose-400',              label: 'FAILED'     }
    : { cls: 'bg-slate-900/60 border-slate-800 text-slate-500',     dot: 'bg-slate-600',             label: 'STANDBY'    };

  return (
    <div className={`hidden sm:flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all duration-500 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
});

const LiveClock = memo(function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );
  useEffect(() => {
    const t = setInterval(() =>
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })),
      1_000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="h-20 flex flex-col items-center justify-center border-t border-white/5 gap-1">
      <span className="text-[8px] font-mono text-slate-600 tracking-widest">SYS</span>
      <span className="text-[9px] font-mono text-slate-500 tabular-nums">{time}</span>
    </div>
  );
});

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  const {
    file, status, steps, isProcessing, isExcelReady, isDownloading, ocrResults, toasts,
    selectFile, clearFile, startProcessing, handleDownloadExcel, dismissToast,
  } = usePipeline();

  const apiPort = new URL(API_BASE_URL).port || '8000';

  return (
    <div className="min-h-screen bg-dark-950 flex font-sans relative overflow-x-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden xl:flex flex-col w-16 glass-sidebar shrink-0 z-20">
        <div className="h-16 flex items-center justify-center border-b border-white/5">
          <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-400/30 rounded-lg flex items-center justify-center glow-accent">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center py-6 gap-5">
          {NAV_ITEMS.map(({ Icon, active, title }) => (
            <button
              key={title}
              title={title}
              aria-label={title}
              aria-current={active ? 'page' : undefined}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                active
                  ? 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-400'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </nav>

        <LiveClock />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="xl:hidden w-7 h-7 bg-cyan-500/15 border border-cyan-400/30 rounded-lg flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">Bill Bot AI</h1>
                <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded border border-cyan-500/20">
                  LAYOUT OCR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Pharmacy Invoice Extraction — Live Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill isProcessing={isProcessing} status={status} />
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Database className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                :{apiPort}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col gap-5 animate-fade-up">

          <div className="flex flex-col lg:flex-row gap-5">
            <div className="w-full lg:w-[36%] shrink-0">
              <ErrorBoundary>
                <UploadPanel
                  file={file}
                  onFileSelect={selectFile}
                  onClearFile={clearFile}
                  isProcessing={isProcessing}
                  status={status}
                  onStartProcessing={startProcessing}
                  onDownloadExcel={handleDownloadExcel}
                  isExcelReady={isExcelReady}
                  isDownloading={isDownloading}
                />
              </ErrorBoundary>
            </div>
            <div className="w-full lg:flex-1 min-w-0">
              <ErrorBoundary>
                <ProgressPanel steps={steps} isProcessing={isProcessing} />
              </ErrorBoundary>
            </div>
          </div>

          <ErrorBoundary>
            <OCRResultsPanel results={ocrResults} isProcessing={isProcessing} />
          </ErrorBoundary>

        </main>

        <footer className="text-center text-[10px] text-slate-700 font-mono py-4 border-t border-white/[0.03]">
          © 2026 Bill Bot AI Layout Extractor · Connected Stack V{APP_VERSION}
        </footer>
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
