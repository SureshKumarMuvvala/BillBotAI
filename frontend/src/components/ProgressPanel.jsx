import React from 'react';
import { Layers, Activity, Clock } from 'lucide-react';
import StepItem from './StepItem';

export default function ProgressPanel({ steps }) {
  // Determine if pipeline is currently active
  const isRunning = steps.some(step => step.status === 'running');
  const isCompleted = steps[steps.length - 1].status === 'completed';
  const hasFailed = steps.some(step => step.status === 'failed');

  const getStatusText = () => {
    if (hasFailed) return 'PIPELINE FAILED';
    if (isCompleted) return 'PIPELINE SUCCESSFUL';
    if (isRunning) return 'PROCESSING CHANDRA PIPELINE...';
    return 'STANDBY';
  };

  const getStatusStyle = () => {
    if (hasFailed) return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
    if (isCompleted) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    if (isRunning) return 'bg-cyan-500/15 text-cyan-400 border-cyan-400/20 animate-pulse';
    return 'bg-slate-900 border-slate-800 text-slate-400';
  };

  // Calculate total pipeline duration
  const totalDuration = steps.reduce((acc, step) => acc + (step.duration || 0), 0);

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent border border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[500px]">
      {/* Background soft lighting grid */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div>
        {/* Header Block */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold tracking-wide text-white">Pipeline Execution Telemetry</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {totalDuration > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 border border-white/5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Elapsed: {totalDuration}s</span>
              </div>
            )}
            <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-1 rounded border ${getStatusStyle()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Stepper Vertical Timeline */}
        <div className="pl-2 pr-2 py-2 flex flex-col justify-start">
          {steps.map((step, idx) => (
            <StepItem
              key={idx}
              name={step.name}
              status={step.status}
              duration={step.duration}
              description={step.description}
              isLast={idx === steps.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Pipeline Status Indicator Card */}
      <div className="mt-4 p-4 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className={`w-4 h-4 text-cyan-400 ${isRunning ? 'animate-pulse' : ''}`} />
          <span>Active State:</span>
          <span className="font-semibold text-slate-200">
            {isRunning ? 'Extracting layouts via Chandra' : isCompleted ? 'All steps finalized successfully' : 'Awaiting file upload'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">Chandra V4 Engine</span>
      </div>
    </div>
  );
}
