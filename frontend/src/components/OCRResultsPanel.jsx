import React, { useState, memo } from 'react';
import {
  Table2, FileText, BarChart3, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';
import { RESULT_COLUMNS, TOTAL_KEYS, DECIMAL_KEYS } from '../config/constants';

// fmt — value formatter using constants
function fmt(val, colKey) {
  if (val === null || val === undefined || val === '')
    return <span className="text-slate-700 font-mono text-[10px]">—</span>;
  // Barcode / text fields: preserve as-is (no numeric coercion / leading-zero loss)
  if (colKey === 'barcode' || colKey === 'batch_no' || colKey === 'hsn_code' || colKey === 'pack')
    return String(val);
  if (DECIMAL_KEYS.has(colKey)) return Number(val).toFixed(2);
  if (colKey === 'gst_percent' || colKey === 'discount_percent') return `${val}%`;
  return String(val);
}

// ── Shimmer skeleton for loading state ──────────────────────────────────────
function SkeletonRow({ cols }) {
  return (
    <tr className="border-b border-slate-800/40">
      <td className="px-3 py-3"><div className="skeleton h-3 w-4 rounded" /></td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className={`skeleton h-3 rounded ${i === 0 ? 'w-28' : 'w-14'}`} style={{ animationDelay: `${i * 60}ms` }} />
        </td>
      ))}
    </tr>
  );
}

function SummaryCard({ itemCount, qualityScore, latencyMs, hasErrors }) {
  const qual = qualityScore ?? null;
  const cards = [
    {
      label: 'Line Items',
      value: itemCount,
      sub: 'extracted rows',
      color: itemCount > 0 ? 'text-emerald-300' : 'text-slate-400',
      accent: itemCount > 0 ? 'border-l-emerald-500/50' : 'border-l-slate-700',
      bg: 'bg-slate-900/50',
    },
    {
      label: 'Quality Score',
      value: qual !== null ? `${qual}/5` : '—',
      sub: 'OCR confidence',
      color: qual >= 4 ? 'text-emerald-300' : qual >= 2 ? 'text-amber-300' : 'text-slate-400',
      accent: 'border-l-indigo-500/40',
      bg: 'bg-slate-900/50',
    },
    {
      label: 'Processing',
      value: latencyMs ? `${latencyMs.toFixed(1)}s` : '—',
      sub: 'total pipeline time',
      color: 'text-cyan-300',
      accent: 'border-l-cyan-500/40',
      bg: 'bg-slate-900/50',
    },
    {
      label: 'Status',
      value: hasErrors ? 'Partial' : 'OK',
      sub: hasErrors ? 'some steps failed' : 'all steps passed',
      color: hasErrors ? 'text-amber-300' : 'text-emerald-300',
      accent: hasErrors ? 'border-l-amber-500/50' : 'border-l-emerald-500/50',
      bg: 'bg-slate-900/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {cards.map(({ label, value, sub, color, accent, bg }) => (
        <div key={label}
          className={`${bg} border border-white/5 border-l-2 ${accent} rounded-xl px-4 py-3
            hover:border-white/10 hover:bg-slate-900/70 transition-all duration-200 cursor-default`}
        >
          <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-1.5">{label}</p>
          <p className={`text-2xl font-bold font-mono tabular-nums ${color}`}>{value}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function MarkdownPreview({ markdown }) {
  const [expanded, setExpanded] = useState(false);
  if (!markdown) return null;
  const preview = expanded ? markdown : markdown.slice(0, 800);

  return (
    <div className="mb-5 rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40 transition-all duration-300">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors duration-200 group"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">OCR Markdown Preview</span>
          <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
            {markdown.length.toLocaleString()} chars
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
          <span className="font-mono">{expanded ? 'collapse' : 'expand'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[400px]' : 'max-h-40'}`}>
        <div className="overflow-y-auto max-h-full px-4 py-3">
          <pre className="text-[11px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap break-words">
            {preview}
            {!expanded && markdown.length > 800 && (
              <span className="text-slate-600"> …{(markdown.length - 800).toLocaleString()} more chars</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

function DataTable({ rows, isLoading }) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-xs border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-10 bg-[#0a0f1e]">
              <tr className="border-b border-slate-800">
                <th className="px-3 py-3 w-8 text-left">
                  <div className="skeleton h-2.5 w-4 rounded" />
                </th>
                {RESULT_COLUMNS.map(col => (
                  <th key={col.key} className={`px-3 py-3 ${col.width}`}>
                    <div className="skeleton h-2.5 w-12 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={RESULT_COLUMNS.length} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 rounded-xl border border-dashed border-slate-800 text-slate-500">
        <Table2 className="w-8 h-8 opacity-20" />
        <p className="text-xs font-mono text-slate-500">No line items extracted</p>
        <p className="text-[10px] text-slate-600 text-center max-w-64 leading-relaxed">
          Configure a valid <code className="text-cyan-500/70">CHANDRA_API_KEY</code> in your .env file and re-run the pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-xs border-collapse min-w-[1400px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#080d1a] border-b border-slate-800">
              <th className="px-3 py-3 text-left text-[9px] font-mono font-bold text-slate-600 tracking-widest w-8">#</th>
              {RESULT_COLUMNS.map(col => (
                <th key={col.key}
                  className={`px-3 py-3 text-[9px] font-mono font-bold text-slate-500 tracking-widest uppercase ${col.width} text-${col.align}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}
                className={`border-b border-slate-800/40 transition-colors duration-150 hover:bg-cyan-500/4 ${
                  idx % 2 === 0 ? 'bg-slate-900/15' : ''
                }`}
              >
                <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">{idx + 1}</td>
                {RESULT_COLUMNS.map(col => (
                  <td key={col.key}
                    className={`px-3 py-2.5 text-${col.align} ${
                      col.key === 'medicine_name'
                        ? 'text-slate-100 font-medium text-xs'
                        : 'font-mono text-[11px] text-slate-400'
                    }`}
                  >
                    {fmt(row[col.key], col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-950/70 border-t border-slate-800">
              {/* Span non-numeric prefix columns: #, Item Name, Batch No, Expiry Date, Pack */}
              <td colSpan={5} className="px-3 py-2 text-[10px] font-mono text-slate-600">
                {rows.length} row{rows.length !== 1 ? 's' : ''}
              </td>
              {RESULT_COLUMNS.slice(4).map(({ key }) => {
                const nums  = rows.map(r => Number(r[key])).filter(n => !isNaN(n));
                const total = nums.length > 0 && TOTAL_KEYS.has(key)
                  ? nums.reduce((a, b) => a + b, 0) : null;
                return (
                  <td key={key} className="px-3 py-2 text-right font-mono text-[10px] text-slate-400 font-semibold">
                    {total !== null ? (DECIMAL_KEYS.has(key) ? total.toFixed(2) : total) : ''}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Empty / loading state ────────────────────────────────────────────────────
function EmptyState({ isProcessing }) {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 flex flex-col items-center justify-center min-h-[280px] gap-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/0 via-slate-900/20 to-slate-900/0 pointer-events-none" />
      {isProcessing ? (
        <>
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin opacity-60" />
          <p className="text-xs font-semibold text-slate-400">Extraction in progress…</p>
          {/* Skeleton preview cards */}
          <div className="w-full max-w-sm px-8 flex flex-col gap-2 mt-2">
            {[80, 60, 72, 55].map((w, i) => (
              <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}%`, animationDelay: `${i*120}ms` }} />
            ))}
          </div>
        </>
      ) : (
        <>
          <BarChart3 className="w-9 h-9 opacity-15" />
          <p className="text-sm font-semibold text-slate-500">Extraction results will appear here</p>
          <p className="text-[11px] text-slate-600 text-center max-w-72 leading-relaxed">
            Upload an invoice and start the Chandra OCR pipeline — live data will populate this panel.
          </p>
        </>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function OCRResultsPanel({ results, isProcessing }) {
  if (!results) return <EmptyState isProcessing={isProcessing} />;

  const { filename, line_items = [], quality_score, ocr_markdown, latency_sec, errors = [] } = results;
  const hasErrors = errors.length > 0;

  return (
    <div className="glass-panel rounded-2xl border border-white/6 flex flex-col gap-1 relative overflow-hidden animate-fade-up transition-all duration-500 hover:border-white/10">
      {/* Ambient emerald glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-500/12 border border-emerald-400/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">OCR Extraction Results</h2>
            <p className="text-[10px] font-mono text-slate-500 truncate max-w-[240px]" title={filename}>
              {filename}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasErrors && (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-2.5 h-2.5" /> PARTIAL
            </span>
          )}
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
            <CheckCircle2 className="w-2.5 h-2.5" /> COMPLETED
          </span>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-1">
        {/* Metrics */}
        <SummaryCard
          itemCount={line_items.length}
          qualityScore={quality_score}
          latencyMs={latency_sec}
          hasErrors={hasErrors}
        />

        {/* Markdown preview */}
        <MarkdownPreview markdown={ocr_markdown} />

        {/* Table section */}
        <div className="flex items-center gap-2 mb-3">
          <Table2 className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-200 tracking-tight">GRN Line Items</h3>
          {line_items.length > 0 && (
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-lg ml-1">
              {line_items.length} rows
            </span>
          )}
        </div>

        <DataTable rows={line_items} isLoading={false} />
      </div>
    </div>
  );
}
