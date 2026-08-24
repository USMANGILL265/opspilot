'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSubmitted(true);
      if (data.data?.demoResetToken) {
        setDemoToken(data.data.demoResetToken);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error sending request';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
        <p className="text-sm text-slate-400 mt-1">Enter your work email to receive a password reset token</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">Reset instructions dispatched</p>
              <p className="text-xs text-emerald-400/80 mt-1">
                If an account matches {email}, a recovery token has been issued.
              </p>
            </div>
          </div>

          {demoToken && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs space-y-2">
              <span className="font-bold text-cyan-400">⚡ Demo / Evaluation Token:</span>
              <p className="font-mono text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                {demoToken}
              </p>
              <Link
                href={`/reset-password?token=${demoToken}`}
                className="inline-block font-semibold text-cyan-400 hover:text-cyan-300 underline"
              >
                Click to proceed to password reset →
              </Link>
            </div>
          )}

          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      ) : (
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
                placeholder="admin@opspilot.com"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
