'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  LogOut,
  Sparkles,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser } from '@/types';

interface HeaderProps {
  user: AuthUser | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search Trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <Link
          href="/search"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs transition group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span>Search customers, products, tickets or ask AI...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
            Ctrl+K
          </kbd>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* AI Health Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 border border-slate-800 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> AI Engine Ready
          </span>
        </div>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden md:block">
              <span className="text-xs font-semibold text-white block leading-none">{user.name}</span>
              <span className="text-[10px] text-slate-400 leading-none mt-1 block">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700/60 text-slate-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
