import React, { useState } from 'react';
import { Table, Code, Info, FileSpreadsheet, CheckCircle2, TrendingUp } from 'lucide-react';

export default function ResultsViewer({ result, isProcessing }) {
  const [activeTab, setActiveTab] = useState('items');

  if (isProcessing) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-white tracking-wide mb-1 animate-pulse">
          EXTRACTING DOCUMENT LAYOUT
        </h3>
        <p className="text-xs text-slate-500 text-center max-w-[250px] leading-relaxed">
          Running OCR region alignment and anchoring medicine table rows. Please wait...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <FileSpreadsheet className="w-12 h-12 text-slate-800 stroke-[1.2]" />
        <div className="text-center">
          <h3 className="text-sm font-medium text-slate-400">No Data Extracted</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-[260px] leading-relaxed">
            Scaffold complete. Run the upload or demo workflow to visualize structured OCR data and layouts.
          </p>
        </div>
      </div>
    );
  }

  const { invoice_metadata, line_items, tax_summary, ocr_performance } = result;

  const getConfidenceStyle = (score) => {
    if (score >= 0.96) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (score >= 0.92) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 glow-accent border border-white/5 flex flex-col h-full">
      {/* Upper Panel Metadata */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold tracking-wide text-white">OCR Extraction Result</h2>
          </div>
          
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'items'
                  ? 'bg-cyan-500 text-dark-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Line Items
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'json'
                  ? 'bg-cyan-500 text-dark-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Raw JSON
            </button>
          </div>
        </div>

        {/* Invoice Metadata Header Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Vendor</span>
            <span className="text-xs font-semibold text-white truncate max-w-[150px]">{invoice_metadata.vendor_name}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Invoice No</span>
            <span className="text-xs font-mono font-bold text-cyan-300">{invoice_metadata.invoice_number}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Date</span>
            <span className="text-xs font-semibold text-slate-300">{invoice_metadata.invoice_date}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">GSTIN</span>
            <span className="text-xs font-mono font-bold text-slate-300">{invoice_metadata.gstin}</span>
          </div>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 overflow-hidden min-h-[250px] flex flex-col justify-between">
        {activeTab === 'items' ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Table Container */}
            <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Batch</th>
                    <th className="py-2.5 px-3 text-center">Expiry</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">MRP</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs font-medium text-slate-300">
                  {line_items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-3 text-white font-semibold">{item.product_name}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{item.batch_no}</td>
                      <td className="py-3 px-3 text-center text-slate-400">{item.expiry_date}</td>
                      <td className="py-3 px-3 text-center text-white">{item.qty}</td>
                      <td className="py-3 px-3 text-right text-slate-400">₹{item.mrp.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-slate-300">₹{item.rate.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-cyan-300 font-bold">₹{item.amount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${getConfidenceStyle(item.confidence)}`}>
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  OCR Quality Metrics
                </span>
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Accuracy: </span>
                    <span className="text-emerald-400 font-bold">{(ocr_performance.average_confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tokens: </span>
                    <span className="text-slate-200">{ocr_performance.total_tokens_extracted}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Latency: </span>
                    <span className="text-cyan-400 font-bold">{ocr_performance.processing_time_seconds}s</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 font-semibold text-xs">
                <div className="flex gap-4 text-slate-400 font-mono text-[11px]">
                  <span>CGST+SGST: ₹{tax_summary.total_tax.toFixed(2)}</span>
                  <span>Subtotal: ₹{(invoice_metadata.total_amount - tax_summary.total_tax).toFixed(2)}</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  Grand Total: <span className="text-cyan-400 font-mono text-base">₹{invoice_metadata.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* JSON Codeblock Panel */
          <pre className="flex-1 bg-dark-950 border border-slate-800 rounded-xl p-4 font-mono text-[10px] text-cyan-300/90 overflow-y-auto max-h-[300px] leading-relaxed selection:bg-slate-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
