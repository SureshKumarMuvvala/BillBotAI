import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const VARIANTS = {
  success: {
    bar:  'bg-emerald-500',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    title: 'text-emerald-300',
    bg:   'bg-slate-900 border-emerald-500/30',
  },
  error: {
    bar:  'bg-rose-500',
    icon: <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
    title: 'text-rose-300',
    bg:   'bg-slate-900 border-rose-500/30',
  },
  info: {
    bar:  'bg-cyan-500',
    icon: <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />,
    title: 'text-cyan-300',
    bg:   'bg-slate-900 border-cyan-500/30',
  },
};

/* ── Single toast card ──────────────────────────────────────────────────────── */
function ToastCard({ id, variant = 'info', title, message, onDismiss, duration = 4000 }) {
  const v = VARIANTS[variant] ?? VARIANTS.info;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  return (
    <div
      className={`relative flex items-start gap-3 w-80 rounded-xl border shadow-2xl shadow-black/60 px-4 py-3 overflow-hidden animate-slide-in ${v.bg}`}
      role="alert"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${v.bar}`} />

      {v.icon}

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${v.title}`}>{title}</p>
        {message && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{message}</p>
        )}
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ── Container — renders in a portal-like fixed position ────────────────────── */
export default function Toaster({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
