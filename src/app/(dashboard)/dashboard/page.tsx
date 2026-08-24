'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Clock,
  RefreshCw,
  PlusCircle,
  Activity,
  Smile,
  Meh,
  Frown,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading operations dashboard metrics...</p>
      </div>
    );
  }

  const totalSentiment =
    (stats?.sentimentBreakdown.positive || 0) +
    (stats?.sentimentBreakdown.neutral || 0) +
    (stats?.sentimentBreakdown.negative || 0);

  const posPct = totalSentiment ? Math.round(((stats?.sentimentBreakdown.positive || 0) / totalSentiment) * 100) : 0;
  const neuPct = totalSentiment ? Math.round(((stats?.sentimentBreakdown.neutral || 0) / totalSentiment) * 100) : 0;
  const negPct = totalSentiment ? Math.round(((stats?.sentimentBreakdown.negative || 0) / totalSentiment) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Operations Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time business telemetry, active support triaging, and AI intelligence insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Telemetry
          </button>

          <Link
            href="/tickets"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" /> New Ticket
          </Link>
        </div>
      </div>

      {/* AI Intelligence Insights Banner */}
      {stats?.aiInsights && stats.aiInsights.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/30 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">OpsPilot AI Operational Insights</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.aiInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Key KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Customers */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{stats?.totalCustomers || 0}</span>
            <Link href="/customers" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="mt-2 text-xs text-slate-500">Active accounts & verified leads in CRM</p>
        </div>

        {/* Total Products */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catalog Inventory</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{stats?.totalProducts || 0}</span>
            <Link href="/products" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              Catalog <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="mt-2 text-xs text-slate-500">Tracked SKUs with stock level telemetry</p>
        </div>

        {/* Open Support Tickets */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Support Tickets</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <LifeBuoy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white tracking-tight">{stats?.openTickets || 0}</span>
              {(stats?.urgentTickets || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {stats?.urgentTickets} Urgent
                </span>
              )}
            </div>
            <Link href="/tickets" className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
              Queue <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="mt-2 text-xs text-slate-500">Inbound requests requiring resolution</p>
        </div>

        {/* Resolved Tickets */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Tickets</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tracking-tight">{stats?.resolvedTickets || 0}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Closed
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Completed support interactions</p>
        </div>

        {/* Customer Sentiment Gauge */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Sentiment Scoring</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Smile className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Smile className="w-4 h-4" /> {posPct}% Positive
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold">
              <Meh className="w-4 h-4" /> {neuPct}% Neutral
            </div>
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Frown className="w-4 h-4" /> {negPct}% Negative
            </div>
          </div>
          {/* Visual Progress Bar */}
          <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div style={{ width: `${posPct}%` }} className="bg-emerald-500" />
            <div style={{ width: `${neuPct}%` }} className="bg-slate-400" />
            <div style={{ width: `${negPct}%` }} className="bg-rose-500" />
          </div>
          <p className="mt-2 text-xs text-slate-500">Analyzed across {totalSentiment} ticket interactions</p>
        </div>

        {/* Operational Tasks */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operations Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">{stats?.openTasks || 0}</span>
              <span className="text-xs text-slate-400">pending</span>
            </div>
            <span className="text-xs font-semibold text-sky-400">
              {stats?.completedTasks || 0} completed
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Internal enterprise workflow milestones</p>
        </div>
      </div>

      {/* Main Section: Recent Activity Audit Stream & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Live Activity & Audit Stream</h2>
            </div>
            <Link href="/audit-logs" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              View All Logs →
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4 hover:bg-slate-950 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0">
                      {log.action.includes('AI') ? (
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                      ) : log.action.includes('USER') ? (
                        <Shield className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Activity className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Triggered by <span className="text-slate-300 font-medium">{log.user?.name || 'System Auto-Worker'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No recent activity recorded yet. Create customers or tickets to populate the stream.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Navigation & Assistant */}
        <div className="space-y-6">
          {/* Quick AI Search Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">AI Search Assistant</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask natural language queries like &ldquo;customers with overdue delivery complaints&rdquo; or &ldquo;high priority technical tickets&rdquo;.
            </p>
            <Link
              href="/search"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
            >
              Open AI Search <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* System Telemetry & Architecture Quick Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              System Architecture Status
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Database:</span>
                <span className="font-semibold text-emerald-400">PostgreSQL (Prisma ORM)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Cache & Queue:</span>
                <span className="font-semibold text-cyan-400">Redis & BullMQ Active</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>AI Providers:</span>
                <span className="font-semibold text-indigo-400">Multi-Model + Fallback</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400">
                <span>API Docs:</span>
                <Link href="/api/docs" target="_blank" className="font-semibold text-cyan-400 hover:underline">
                  Swagger UI (OpenAPI 3.0) ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
