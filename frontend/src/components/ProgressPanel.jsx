import React from 'react';
import { Layers, Activity, Clock, Wifi } from 'lucide-react';
import StepItem from './StepItem';

export default function ProgressPanel({ steps, isProcessing }) {
  const isRunning   = steps.some(s => s.status === 'running');
  const isCompleted = steps[steps.length - 1].status === 'completed';
  const hasFailed   = steps.some(s => s.status === 'failed');
  const totalDuration = steps.reduce((acc, s) => acc + (s.duration || 0), 0);

  const statusLabel = hasFailed ? 'FAILED' : isCompleted ? 'COMPLETE' : isRunning ? 'RUNNING' : 'STANDBY';
  const statusStyle = hasFailed
    ? 'bg-rose-500/12 text-rose-400 border-rose-500/20'
    : isCompleted
      ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20'
      : isRunning
        ? 'bg-cyan-500/12 text-cyan-400 border-cyan-400/20 animate-pulse'
        : 'bg-slate-900/60 border-slate-800 text-slate-500';

  return (
    <div className="glass-panel rounded-2xl border border-white/6 relative overflow-hidden flex flex-col h-full min-h-[480px] transition-all duration-500 hover:border-white/10">
      {/* Ambient top-right glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      {isRunning && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 border rounded-lg flex items-center justify-center transition-all duration-300 ${
            isRunning ? 'bg-cyan-500/15 border-cyan-400/30 glow-accent' : 'bg-slate-900/60 border-slate-700'
          }`}>
            <Layers className={`w-3.5 h-3.5 transition-colors duration-300 ${isRunning ? 'text-cyan-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Pipeline Telemetry</h2>
            <p className="text-[10px] text-slate-500 font-mono">Bill Bot AI execution engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalDuration > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
              <Clock className="w-3 h-3 text-slate-600" />
              {totalDuration}s
            </div>
          )}
          <span className={`text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg border ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="flex-1 px-5 py-5 flex flex-col">
        {steps.map((step, idx) => (
          <StepItem
            key={step.key}
            name={step.name}
            status={step.status}
            duration={step.duration}
            description={step.description}
            isLast={idx === steps.length - 1}
          />
        ))}
      </div>

      {/* ── Footer status bar ── */}
      <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className={`w-3.5 h-3.5 ${isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-slate-600">State:</span>
          <span className="font-medium text-slate-300">
            {isRunning
              ? 'Extracting via Chandra OCR'
              : isCompleted ? 'All steps finalized'
              : hasFailed ? 'Pipeline encountered errors'
              : 'Awaiting file upload'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 font-mono">
          <Wifi className="w-3 h-3" />
          <span>:8000</span>
        </div>
      </div>
    </div>
  );
}
