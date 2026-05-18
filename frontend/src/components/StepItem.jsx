import React from 'react';
import { Circle, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function StepItem({ name, status, duration, description, isLast }) {

  const getIcon = () => {
    switch (status) {
      case 'running':   return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':    return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:          return <Circle className="w-4 h-4 text-slate-700 stroke-[1.5]" />;
    }
  };

  const nameStyle = {
    running:   'text-cyan-300 font-semibold',
    completed: 'text-emerald-300 font-semibold',
    failed:    'text-rose-300 font-semibold',
    idle:      'text-slate-500 font-normal',
  }[status] ?? 'text-slate-500';

  const nodeBg = {
    running:   'bg-cyan-500/12 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    completed: 'bg-emerald-500/12 border-emerald-500/30',
    failed:    'bg-rose-500/12 border-rose-500/30',
    idle:      'bg-slate-900/40 border-slate-800',
  }[status] ?? 'bg-slate-900/40 border-slate-800';

  const connectorStyle = {
    completed: 'bg-emerald-500/50',
    running:   'connector-animated',
    failed:    'bg-rose-500/40',
    idle:      'bg-slate-800/60',
  }[status] ?? 'bg-slate-800/60';

  return (
    <div className={`step-row flex gap-3.5 relative group transition-all duration-300 ${status !== 'idle' ? 'animate-fade-up' : ''}`}>

      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-[13px] top-7 w-[2px] h-[calc(100%-4px)] pointer-events-none overflow-hidden">
          <div className={`w-full h-full rounded-full ${connectorStyle} transition-all duration-700`} />
        </div>
      )}

      {/* Node circle */}
      <div className={`w-[28px] h-[28px] shrink-0 flex items-center justify-center rounded-full border z-10 transition-all duration-300 ${nodeBg}`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="pb-7 flex-1 flex items-start justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h4 className={`text-xs tracking-wide transition-all duration-300 ${nameStyle}`}>{name}</h4>
          {description && (
            <p className={`step-description text-[10px] mt-0.5 leading-relaxed max-w-[460px] truncate transition-colors duration-300 ${
              status === 'running' ? 'text-cyan-400/70' : 'text-slate-500'
            }`} title={description}>
              {description}
            </p>
          )}
        </div>

        {(status === 'completed' || status === 'running') && duration !== undefined && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-950/50 border border-white/5 px-2 py-0.5 rounded shrink-0">
            <Clock className="w-2.5 h-2.5 text-slate-600" />
            {duration}s
          </div>
        )}
      </div>
    </div>
  );
}
