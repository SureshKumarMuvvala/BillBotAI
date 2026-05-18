import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Play, Sparkles, Loader2, Zap } from 'lucide-react';
import PreviewCard from './PreviewCard';

export default function UploadPanel({
  file, onFileSelect, onClearFile, isProcessing,
  status, onStartProcessing, onDownloadExcel,
  isExcelReady, isDownloading,
}) {
  const fileInputRef   = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0] && !isProcessing) onFileSelect(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => {
    if (e.target.files?.[0] && !isProcessing) onFileSelect(e.target.files[0]);
  };
  const runDemoMode = () => {
    if (!isProcessing) onFileSelect({ name: 'sample_pharmacy_invoice.pdf', size: 1048576, type: 'application/pdf' });
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/6 relative overflow-hidden flex flex-col h-full min-h-[480px] transition-all duration-500 hover:border-white/10">
      {/* Top glow orb */}
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5">
        <div className="w-7 h-7 bg-cyan-500/10 border border-cyan-400/20 rounded-lg flex items-center justify-center">
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Document Control</h2>
          <p className="text-[10px] text-slate-500 font-mono">Invoice upload gateway</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-5 py-4 gap-4">

        {/* Drop zone / Preview card */}
        {!file ? (
          <div
            onDragEnter={handleDrag} onDragOver={handleDrag}
            onDragLeave={handleDrag} onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current.click()}
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[200px] group ${
              isDragActive
                ? 'border-cyan-400 bg-cyan-500/6 scale-[0.99]'
                : 'border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/30'
            }`}
          >
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={isProcessing} />

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 transition-all duration-300 ${
              isDragActive
                ? 'bg-cyan-500/15 border-cyan-400/40 scale-110'
                : 'bg-slate-900/80 border-slate-700 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5'
            }`}>
              <Upload className={`w-6 h-6 transition-colors duration-300 ${isDragActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400/80'}`} />
            </div>

            <p className="text-xs font-semibold text-slate-200 mb-1">
              {isDragActive ? 'Drop to upload' : 'Drag & drop document'}
            </p>
            <p className="text-[10px] text-slate-500 mb-4">or click to browse local files</p>

            <div className="flex gap-1.5 text-[9px] font-mono bg-slate-950/80 px-2.5 py-1 rounded-md border border-white/5">
              {['PDF', 'PNG', 'JPG'].map((ext, i) => (
                <React.Fragment key={ext}>
                  {i > 0 && <span className="text-slate-700">·</span>}
                  <span className="text-cyan-400/80">{ext}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Active Document</span>
              <span className="text-cyan-400/70 font-mono text-[10px]">Ready to process</span>
            </div>
            <PreviewCard file={file} onClear={!isProcessing ? onClearFile : null} status={status} />
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="px-5 pb-5 pt-1 flex flex-col gap-3 border-t border-white/5 mt-auto">
        {/* Demo mode link */}
        {!file && (
          <button
            onClick={runDemoMode} disabled={isProcessing}
            className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono text-cyan-400/70 hover:text-cyan-300 border border-dashed border-cyan-500/15 hover:border-cyan-500/30 rounded-lg transition-all duration-200 hover:bg-cyan-500/5"
          >
            <Sparkles className="w-3 h-3" />
            LOAD SAMPLE PHARMACY INVOICE
          </button>
        )}

        {/* Start button */}
        <button
          id="btn-start-extraction"
          onClick={onStartProcessing}
          disabled={!file || isProcessing}
          className={`btn-press w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all duration-200 ${
            !file
              ? 'bg-slate-900/80 border-slate-800/80 text-slate-600 cursor-not-allowed'
              : isProcessing
                ? 'bg-cyan-500/8 border-cyan-500/20 text-cyan-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 border-cyan-400/20 text-white shadow-lg shadow-cyan-950/30 hover:shadow-cyan-900/40 hover:-translate-y-0.5'
          }`}
        >
          {isProcessing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> EXTRACTING…</>
            : <><Zap className="w-4 h-4" /> START CHANDRA EXTRACTION</>
          }
        </button>

        {/* Download button */}
        <button
          id="btn-download-excel"
          onClick={onDownloadExcel}
          disabled={!isExcelReady || isProcessing || isDownloading}
          className={`btn-press w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all duration-200 ${
            !isExcelReady
              ? 'bg-slate-950/60 border-slate-900/50 text-slate-700 cursor-not-allowed'
              : isDownloading
                ? 'bg-emerald-600/15 border-emerald-500/20 text-emerald-400 cursor-wait'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border-emerald-500/20 text-white shadow-lg shadow-emerald-950/30 hover:-translate-y-0.5'
          }`}
        >
          {isDownloading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> PREPARING…</>
            : <><FileSpreadsheet className="w-4 h-4" /> DOWNLOAD EXCEL SPREADSHEET</>
          }
        </button>
      </div>
    </div>
  );
}
