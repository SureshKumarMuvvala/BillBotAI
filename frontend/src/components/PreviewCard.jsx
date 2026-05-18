import React from 'react';
import { FileText, Eye, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function PreviewCard({ file, onClear, status }) {
  if (!file) return null;

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getBadgeColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'running':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'idle':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 relative group">
      {/* Visual File Preview Thumbnail Frame */}
      <div className="h-32 bg-dark-950 border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:border-cyan-500/30 transition-all duration-300">
        {/* Soft grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-30" />
        
        {/* Medicine Invoice Mock Silhouette */}
        <div className="flex flex-col items-center justify-center gap-2 text-slate-500 group-hover:text-cyan-400/80 transition-colors z-10">
          <FileText className="w-10 h-10 stroke-[1.2]" />
          <span className="text-[10px] font-mono tracking-wider uppercase bg-slate-950 border border-white/5 px-2 py-0.5 rounded">
            {file.type ? file.type.split('/')[1] || 'PDF' : 'PDF'}
          </span>
        </div>

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300 z-20">
          <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-cyan-400/20 rounded-md">
            <Eye className="w-3.5 h-3.5" />
            PREVIEW ACTIVE
          </span>
        </div>
      </div>

      {/* Meta Details Block */}
      <div className="flex items-center justify-between gap-4">
        <div className="truncate flex-1">
          <h5 className="text-xs font-semibold text-white truncate" title={file.name}>
            {file.name}
          </h5>
          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
            <span>Size: {formatSize(file.size)}</span>
            <span>•</span>
            <span className={`uppercase px-1.5 py-0.2 rounded border ${getBadgeColor()}`}>
              {status || 'idle'}
            </span>
          </div>
        </div>

        {/* Clear Button */}
        {onClear && (
          <button
            onClick={onClear}
            className="p-2 bg-slate-950/60 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 rounded-lg transition-all"
            title="Remove file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chandra Accuracy Assurance Badge */}
      {status === 'completed' && (
        <div className="mt-1 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-500 stroke-[2]" />
          <span>Extracted layout with high fidelity confidence</span>
        </div>
      )}
    </div>
  );
}
