'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2, UserCheck, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-400 mt-1">Sign in to your OpsPilot enterprise workspace</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <span className="text-base leading-none">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@opspilot.com"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Quick Fill */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
          1-Click Demo Credentials
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@opspilot.com', 'AdminPass123!')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
              <Shield className="w-3.5 h-3.5" /> Admin
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">admin@opspilot</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('manager@opspilot.com', 'ManagerPass123!')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
              <Users className="w-3.5 h-3.5" /> Manager
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">manager@opspilot</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('employee@opspilot.com', 'EmployeePass123!')}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition group"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
              <UserCheck className="w-3.5 h-3.5" /> Employee
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">employee@opspilot</div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
          Register new user
        </Link>
      </div>
    </div>
  );
}
