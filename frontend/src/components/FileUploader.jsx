import React, { useRef, useState } from 'react';
import { Upload, FileText, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function FileUploader({ onUploadStart, isProcessing }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !isProcessing) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0] && !isProcessing) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    if (!isProcessing) {
      fileInputRef.current.click();
    }
  };

  const handleFile = (file) => {
    onUploadStart(file);
  };

  const runDemoMode = () => {
    if (!isProcessing) {
      // Pass a fake file named sample_invoice.png
      onUploadStart({ name: 'sample_pharmacy_invoice.pdf', size: 1048576, type: 'application/pdf' });
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent border border-white/5 relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background glow orb */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold tracking-wide text-white">Upload Document</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Upload any medical or pharmacy invoice (PDF, PNG, JPG) to trigger layout-aware extraction with Chandra OCR.
        </p>

        {/* Drag and Drop Container */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInput}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-cyan-400 bg-cyan-500/5 scale-[0.99]' 
              : 'border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/30'
          } ${isProcessing ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          
          <div className="w-12 h-12 bg-slate-900/80 border border-white/5 flex items-center justify-center rounded-xl mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>

          <span className="text-sm font-medium text-slate-200 mb-1">
            Drag & drop file here
          </span>
          <span className="text-xs text-slate-500 mb-4">
            or click to browse your system
          </span>
          
          <div className="flex gap-2 text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2 py-1 rounded-md border border-white/5">
            <span className="text-cyan-400">PDF</span>
            <span className="text-slate-600">•</span>
            <span>PNG</span>
            <span className="text-slate-600">•</span>
            <span>JPG</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Need a sample document?</span>
          <span className="text-cyan-400/80">No file ready?</span>
        </div>
        
        <button
          onClick={runDemoMode}
          disabled={isProcessing}
          className={`w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/30 border border-cyan-400/20 active:scale-95 transition-all duration-150 ${
            isProcessing ? 'opacity-50 cursor-not-allowed hover:from-cyan-600 hover:to-blue-700' : ''
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
          RUN DEMO WORKFLOW
        </button>
      </div>
    </div>
  );
}
