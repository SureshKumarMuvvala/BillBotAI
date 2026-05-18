import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, RefreshCw } from 'lucide-react';

export default function LogConsole({ logs, progress, status, activeFile }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll terminal to bottom when new logs stream in
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getStatusBadgeColor = () => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'PROCESSING':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 animate-pulse';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent border border-white/5 flex flex-col justify-between h-full min-h-[350px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold tracking-wide text-white">Pipeline Execution Logs</h2>
          </div>
          <span className={`text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-1 rounded-md border ${getStatusBadgeColor()}`}>
            {status || 'IDLE'}
          </span>
        </div>

        {activeFile && (
          <div className="mb-4 bg-slate-900/60 border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Processing Document:</span>
            <span className="font-mono text-cyan-300 truncate max-w-[200px]" title={activeFile}>
              {activeFile}
            </span>
          </div>
        )}
      </div>

      {/* Terminal Display */}
      <div className="flex-1 bg-dark-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs overflow-y-auto min-h-[180px] max-h-[220px] flex flex-col gap-2 relative">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Cpu className="w-8 h-8 text-slate-700 stroke-[1.5]" />
            <span>Ready. Upload a document to stream real-time logs.</span>
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2 items-start leading-relaxed text-slate-300">
                <span className="text-slate-600 select-none">{`>`}</span>
                <span className={index === logs.length - 1 ? "text-cyan-400" : ""}>{log}</span>
              </div>
            ))}
            {status === 'PROCESSING' && (
              <div className="flex gap-2 items-center leading-relaxed text-cyan-500/80 animate-pulse">
                <span className="text-slate-600 select-none animate-none">{`>`}</span>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Chandra Layout Extractor...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </>
        )}
      </div>

      {/* Progress Bar Footer */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            Confidence Integrity
          </span>
          <span className="font-mono font-bold text-cyan-400">{progress}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
          <div 
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
