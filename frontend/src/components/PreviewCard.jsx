import React from 'react';
import { FileText, Trash2, ShieldCheck, AlertCircle, Loader2, Scan } from 'lucide-react';

export default function PreviewCard({ file, onClear, status }) {
  if (!file) return null;

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const ext = (file.type ? file.type.split('/')[1] : 'PDF').toUpperCase().slice(0, 4);

  const badge = {
    completed: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'COMPLETED' },
    running:   { cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse', label: 'RUNNING' },
    failed:    { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'FAILED' },
    idle:      { cls: 'bg-slate-800/80 text-slate-400 border-slate-700', label: 'IDLE' },
  }[status] ?? { cls: 'bg-slate-800/80 text-slate-400 border-slate-700', label: 'IDLE' };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all duration-300">

      {/* Thumbnail area */}
      <div className="relative h-36 bg-dark-800 flex items-center justify-center overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.4)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Central icon */}
        <div className="relative z-10 flex flex-col items-center gap-2.5 group-hover:scale-105 transition-transform duration-300">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
            status === 'running'
              ? 'bg-cyan-500/15 border-cyan-400/30 shadow-[0_0_16px_rgba(6,182,212,0.2)]'
              : 'bg-slate-800/80 border-slate-700 group-hover:border-slate-600'
          }`}>
            {status === 'running'
              ? <Scan className="w-7 h-7 text-cyan-400 animate-pulse" />
              : <FileText className="w-7 h-7 text-slate-400 stroke-[1.2] group-hover:text-slate-300 transition-colors" />
            }
          </div>
          <span className="text-[9px] font-mono tracking-widest text-slate-500 bg-slate-950/80 border border-white/5 px-2 py-0.5 rounded">
            {ext}
          </span>
        </div>

        {/* Scanning animation during processing */}
        {status === 'running' && (
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            style={{ animation: 'scan 2s linear infinite', top: '50%' }} />
        )}

        {/* Clear button overlay */}
        {onClear && (
          <button
            onClick={onClear}
            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200
              p-1.5 bg-slate-950/80 hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/20
              text-slate-500 hover:text-rose-400 rounded-lg backdrop-blur-sm"
            title="Remove file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Meta row */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-3 border-t border-slate-800">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-100 truncate" title={file.name}>{file.name}</p>
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">{formatSize(file.size)}</p>
        </div>
        <span className={`text-[8px] font-mono font-bold tracking-widest border px-1.5 py-0.5 rounded shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Completion banner */}
      {status === 'completed' && (
        <div className="px-3.5 py-2 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center gap-2 text-[10px] text-emerald-400/80 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          Extracted layout with high fidelity confidence
        </div>
      )}
        {status === 'failed' && (
          <div className="px-3.5 py-2 bg-rose-500/5 border-t border-rose-500/10 flex items-start gap-2 text-[10px] text-rose-400/80 font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <div className="break-words">
            {file?.error || "Processing failed"}
          </div>
        </div>
      )}
    </div>
  );
}
