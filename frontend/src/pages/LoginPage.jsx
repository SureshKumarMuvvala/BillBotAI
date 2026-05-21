import React, { useState } from 'react';
import { Layers, Lock, LogIn, User } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../config/constants';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, isLocalBypass } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && (isLocalBypass || isAuthenticated)) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -20%, rgba(6,182,212,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(99,102,241,0.08) 0%, transparent 50%)',
        }}
      />

      <div className="w-full max-w-md relative animate-fade-up">
        <div className="glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl border border-white/[0.08]">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-cyan-500/15 border border-cyan-400/30 rounded-2xl flex items-center justify-center glow-accent mb-4">
              <Layers className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Bill Bot AI</h1>
            <p className="text-[11px] text-slate-500 mt-1 font-mono tracking-widest uppercase">
              Demo Access · v{APP_VERSION}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-900/80 border border-slate-700/80 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-60 transition-colors"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-900/80 border border-slate-700/80 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-60 transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 text-center"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold border border-cyan-500/30 transition-all btn-press disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-slate-600 text-center mt-6 font-mono">
            Protected demo · credentials configured via Vercel env
          </p>
        </div>
      </div>
    </div>
  );
}
