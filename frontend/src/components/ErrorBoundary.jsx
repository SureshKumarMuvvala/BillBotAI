/**
 * src/components/ErrorBoundary.jsx
 * React class-based error boundary + a function wrapper for convenience.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   // or with custom fallback:
 *   <ErrorBoundary fallback={<p>Something went wrong.</p>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300 min-h-[200px]">
        <AlertTriangle className="w-8 h-8 text-rose-400 opacity-70" />
        <div className="text-center">
          <p className="text-sm font-semibold mb-1">Something went wrong</p>
          <p className="text-[11px] text-rose-400/70 font-mono max-w-sm">
            {this.state.error?.message ?? 'An unexpected rendering error occurred.'}
          </p>
        </div>
        <button
          onClick={this.handleReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }
}

/**
 * Lightweight loading boundary — shows a shimmer skeleton while `loading` is true.
 * @param {{ loading: boolean, rows?: number, children: React.ReactNode }} props
 */
export function LoadingBoundary({ loading, rows = 4, children }) {
  if (!loading) return children;

  return (
    <div className="flex flex-col gap-3 p-6 animate-pulse" aria-busy="true" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{ width: `${85 - i * 12}%`, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
