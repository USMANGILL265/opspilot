'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  LifeBuoy,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Shield,
  FileCode2,
} from 'lucide-react';
import { AuthUser } from '@/types';

interface SidebarProps {
  user: AuthUser | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Support Tickets', href: '/tickets', icon: LifeBuoy, hasAiBadge: true },
    { name: 'AI Search', href: '/search', icon: Search, isAiFeature: true },
    { name: 'API Docs', href: '/api/docs', icon: FileCode2, isExternal: true },
    ...(user?.role === 'ADMIN'
      ? [{ name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert }]
      : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-tight leading-none block">OpsPilot</span>
          <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mt-0.5 block">
            Enterprise AI
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Operations Hub
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              target={item.isExternal ? '_blank' : undefined}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.hasAiBadge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                    AI
                  </span>
                )}
                {item.isAiFeature && (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Role Card */}
      {user && (
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 uppercase border border-slate-700">
              {user.name.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
