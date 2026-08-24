'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Users,
  Package,
  LifeBuoy,
  ArrowRight,
  Loader2,
  Tag,
  Smile,
  Meh,
  Frown,
  Filter,
} from 'lucide-react';
import { SearchResults } from '@/lib/search';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [aiAssisted, setAiAssisted] = useState(true);
  const [entityType, setEntityType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);

  const presetQueries = [
    'customers with overdue delivery complaints',
    'urgent billing tickets',
    'out of stock server hardware',
    'Apex FinTech payment issues',
    'critical infrastructure problems',
  ];

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        aiAssisted: aiAssisted.toString(),
        type: entityType,
      });

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Error executing search:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handlePresetClick = (preset: string) => {
    setQuery(preset);
    handleSearch(preset);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Search Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Intelligent Enterprise Search
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Ask OpsPilot in Natural Language
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Query across customers, products, and support tickets. The AI interpreter automatically converts natural language questions into structured database filters.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
        <form onSubmit={onSubmit} className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a natural language query (e.g. 'customers with overdue delivery complaints')..."
            className="w-full pl-12 pr-28 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Search
          </button>
        </form>

        {/* Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aiAssisted}
              onChange={(e) => setAiAssisted(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-indigo-500 focus:ring-0"
            />
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Enable AI Intent Interpretation
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Filter Scope:</span>
            {['all', 'customers', 'products', 'tickets'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEntityType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition ${
                  entityType === type
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
          Try Example:
        </span>
        {presetQueries.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-cyan-300 transition"
          >
            &ldquo;{preset}&rdquo;
          </button>
        ))}
      </div>

      {/* AI Intent Interpretation Card */}
      {results?.intent && (
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 backdrop-blur-md text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>AI Query Interpretation</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{results.intent.explanation}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {results.intent.keywords?.map((k, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono">
                keyword: {k}
              </span>
            ))}
            {results.intent.categoryFilter && (
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px]">
                category: {results.intent.categoryFilter}
              </span>
            )}
            {results.intent.sentimentFilter && (
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[10px]">
                sentiment: {results.intent.sentimentFilter}
              </span>
            )}
            {results.intent.priorityFilter && (
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">
                priority: {results.intent.priorityFilter}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results Container */}
      {results && (
        <div className="space-y-6 pt-2">
          <div className="text-xs font-semibold text-slate-400">
            Found <span className="text-white font-bold">{results.totalMatches}</span> total matches across operational entities.
          </div>

          {/* 1. Ticket Matches */}
          {results.tickets?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-rose-400" /> Support Tickets ({results.tickets.length})
              </h3>
              <div className="space-y-2.5">
                {results.tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets`}
                    className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between text-xs group block"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold">{t.ticketNumber}</span>
                        <span className="font-semibold text-white group-hover:text-cyan-300 transition">{t.subject}</span>
                      </div>
                      <p className="text-slate-400 line-clamp-1">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {t.priority}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 2. Customer Matches */}
          {results.customers?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Customers ({results.customers.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {results.customers.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-white">{c.name}</span>
                    <p className="text-slate-400">{c.company || 'Direct Client'} • {c.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Product Matches */}
          {results.products?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" /> Products ({results.products.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {results.products.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="font-mono text-cyan-400 text-[10px]">{p.sku}</span>
                    </div>
                    <p className="text-emerald-400 font-mono font-semibold">${p.price.toFixed(2)} • {p.stock} in stock</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.totalMatches === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching records found. Try a different query term or toggle AI interpretation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
