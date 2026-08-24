import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-white block">OpsPilot</span>
            <span className="text-xs font-medium text-cyan-400 tracking-wider uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Operations
            </span>
          </div>
        </Link>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
        OpsPilot SaaS Platform • Production Engineering Candidate Assessment
      </div>
    </div>
  );
}
