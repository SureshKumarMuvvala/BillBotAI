import React from 'react';
import { Circle, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function StepItem({ name, status, duration, description, isLast }) {
  const getIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'idle':
      default:
        return <Circle className="w-5 h-5 text-slate-600 stroke-[1.5]" />;
    }
  };

  const getTextStyle = () => {
    switch (status) {
      case 'running':
        return 'text-cyan-400 font-semibold';
      case 'completed':
        return 'text-emerald-400 font-semibold';
      case 'failed':
        return 'text-rose-400 font-semibold';
      case 'idle':
      default:
        return 'text-slate-500 font-normal';
    }
  };

  const getCircleBg = () => {
    switch (status) {
      case 'running':
        return 'bg-cyan-500/10 border-cyan-400/40 glow-border';
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'failed':
        return 'bg-rose-500/10 border-rose-500/30';
      case 'idle':
      default:
        return 'bg-slate-900/60 border-slate-800';
    }
  };

  const getConnectorStyle = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/40';
      case 'running':
        return 'bg-gradient-to-b from-emerald-500/40 to-cyan-500/30';
      case 'failed':
        return 'bg-rose-500/40';
      case 'idle':
      default:
        return 'bg-slate-800/80';
    }
  };

  return (
    <div className="flex gap-4 relative group">
      {/* Visual Timeline Connectors */}
      {!isLast && (
        <div className="absolute left-[13.5px] top-6 w-[2px] h-[calc(100%-8px)] pointer-events-none transition-colors duration-500">
          <div className={`w-full h-full rounded ${getConnectorStyle()}`} />
        </div>
      )}

      {/* Circle Icon Badge */}
      <div className={`w-[29px] h-[29px] flex items-center justify-center rounded-full border z-10 transition-all duration-300 ${getCircleBg()}`}>
        {getIcon()}
      </div>

      {/* Text Context */}
      <div className="pb-6 flex-1 flex items-start justify-between gap-4">
        <div>
          <h4 className={`text-xs tracking-wide transition-all ${getTextStyle()}`}>
            {name}
          </h4>
          {description && (
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-[450px]">
              {description}
            </p>
          )}
        </div>
        
        {/* Time duration indicator (if active or done) */}
        {duration !== undefined && (status === 'completed' || status === 'running') && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-950/60 border border-white/5 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>{duration}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
