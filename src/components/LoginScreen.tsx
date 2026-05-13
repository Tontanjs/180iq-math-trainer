'use client';
import { useState, useRef } from 'react';
import { Brain, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { tryLogin } from '@/lib/auth';

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (tryLogin(username.trim(), password)) {
        onLogin();
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a1f35] via-[#0d2d4a] to-[#153B5C]">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0F75BC]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#0F75BC]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F75BC] rounded-2xl shadow-lg shadow-[#0F75BC]/40 mb-4">
            <Brain className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">180IQ</h1>
          <p className="text-slate-400 text-sm mt-1">Mental Math Trainer</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-6 text-center">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && pwRef.current?.focus()}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-[#0F75BC] focus:ring-1 focus:ring-[#0F75BC] transition-all text-sm"
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  ref={pwRef}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-11 py-3 text-white placeholder-slate-500 outline-none focus:border-[#0F75BC] focus:ring-1 focus:ring-[#0F75BC] transition-all text-sm"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-rose-400 text-sm text-center bg-rose-500/10 rounded-xl py-2 px-3 border border-rose-500/20">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-12 bg-[#0F75BC] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0F75BC]/30 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Training
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
