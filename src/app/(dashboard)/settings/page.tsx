'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  Database,
  Cpu,
  Zap,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  HardDrive,
} from 'lucide-react';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Error fetching health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-cyan-400" /> Platform Infrastructure &amp; AI Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect multi-tier service health, configure AI provider abstractions, and monitor database telemetry.
        </p>
      </div>

      {/* Health Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Live System Diagnostics
          </h2>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-xs text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} /> Refresh
          </button>
        </div>

        {health && (
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Database className="w-4 h-4" /> PostgreSQL Database
              </div>
              <p className="text-slate-400">Status: <span className="font-bold text-emerald-400">{health.checks?.database?.status}</span></p>
              <p className="text-slate-500 text-[11px]">Normalized ORM Entities via Prisma</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <HardDrive className="w-4 h-4" /> Redis Cache &amp; Queue
              </div>
              <p className="text-slate-400">Mode: <span className="font-bold text-cyan-400">{health.checks?.cache?.mode}</span></p>
              <p className="text-slate-500 text-[11px]">BullMQ Asynchronous Background Workers</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Sparkles className="w-4 h-4" /> AI Provider Abstraction
              </div>
              <p className="text-slate-400">Provider: <span className="font-bold text-indigo-400">{health.checks?.aiService?.activeProvider}</span></p>
              <p className="text-slate-500 text-[11px]">Model: {health.checks?.aiService?.activeModel}</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Provider Architecture Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Supported AI Providers
        </h2>
        <p className="text-xs text-slate-400">
          OpsPilot uses an extensible <code className="text-cyan-400">AIService</code> interface with graceful offline fallback. Set <code className="text-slate-300 font-mono">AI_PROVIDER</code> in <code className="text-slate-300 font-mono">.env</code>.
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">1. Google Gemini (1.5 Flash / 2.0 Flash)</span>
              <span className="text-slate-500 text-[11px]">High-speed multimodal inference with native JSON schema formatting.</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Cloud Hosted
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">2. OpenAI (GPT-4o / GPT-4o-mini)</span>
              <span className="text-slate-500 text-[11px]">OpenAI API and compatible gateways (LiteLLM, OpenRouter, Groq).</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Cloud Hosted
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">3. Ollama Local LLM (Llama 3.2 / Qwen 2.5 / Mistral)</span>
              <span className="text-slate-500 text-[11px]">100% private on-premise inference with zero external network dependencies.</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Local / On-Premise
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">4. Deterministic Heuristic Fallback Engine</span>
              <span className="text-slate-500 text-[11px]">Guarantees 100% uptime, zero cost, and immediate execution during offline testing.</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Built-in Failover
            </span>
          </div>
        </div>
      </div>

      {/* Benchmark Seeder Reference */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" /> 35,000+ Record Benchmark Dataset Seeder
        </h2>
        <p className="text-slate-400 leading-relaxed">
          OpsPilot includes a high-throughput chunked benchmark seeder script to stress test PostgreSQL query planners, indexes, and caching under real-world enterprise volume (10k customers, 5k products, 20k tickets).
        </p>
        <div className="p-3 rounded-xl bg-slate-950 font-mono text-cyan-400 text-xs border border-slate-800">
          pnpm run db:seed:benchmark
        </div>
      </div>
    </div>
  );
}
