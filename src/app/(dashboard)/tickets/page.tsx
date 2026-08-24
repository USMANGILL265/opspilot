'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Plus,
  Filter,
  Sparkles,
  MessageSquare,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Send,
  Copy,
  RefreshCw,
  X,
  Lock,
  ArrowRight,
  Building,
} from 'lucide-react';
import { TicketData, TicketPriority, TicketCategory, TicketStatus } from '@/types';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; company?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Ticket creation modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    customerId: '',
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Ticket detail drawer
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const res = await fetch(`/api/tickets?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, categoryFilter]);

  const fetchCustomersList = async () => {
    try {
      const res = await fetch('/api/customers?limit=100');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchCustomersList();
  }, [fetchTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      setIsCreateOpen(false);
      setCreateData({
        customerId: '',
        subject: '',
        description: '',
        priority: 'MEDIUM',
        category: 'GENERAL',
      });
      fetchTickets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating ticket';
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const openTicketDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.data);
      }
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          isInternal: isInternalComment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedTicket((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.data],
        }));
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleRunAiAnalysis = async (ticketId: string) => {
    setAiAnalyzing(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket((prev: any) => ({
          ...prev,
          aiAnalysis: data.data,
        }));
        fetchTickets();
      }
    } catch (err) {
      console.error('Error triggering AI analysis:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
        fetchTickets();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleCopySuggestedResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setCommentText(text);
    setTimeout(() => setCopiedResponse(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-rose-400" /> Support Ticket Queue & AI Triaging
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inbound customer tickets with real-time AI sentiment analysis, priority recommendations, and response drafting.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Support Ticket
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket #, subject..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="WAITING">WAITING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Categories</option>
            <option value="BILLING">BILLING</option>
            <option value="TECHNICAL">TECHNICAL</option>
            <option value="DELIVERY">DELIVERY</option>
            <option value="ACCOUNT">ACCOUNT</option>
            <option value="GENERAL">GENERAL</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
            Loading active support queue...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            No support tickets found matching current filters.
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicketDetail(t.id)}
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Column: Number, Customer, Subject */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {t.ticketNumber}
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-500" />
                    {t.customer?.name || 'Customer'} {t.customer?.company ? `(${t.customer.company})` : ''}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition truncate">
                  {t.subject}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-1">
                  {t.description}
                </p>
              </div>

              {/* Middle Column: Badges & AI Tag */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Priority Badge */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    t.priority === 'URGENT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                      : t.priority === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : t.priority === 'MEDIUM'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  {t.priority}
                </span>

                {/* Category Badge */}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {t.category}
                </span>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    t.status === 'RESOLVED' || t.status === 'CLOSED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {t.status.replace(/_/g, ' ')}
                </span>

                {/* AI Sentiment Pill if analyzed */}
                {t.aiAnalysis && (
                  <span
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      t.aiAnalysis.sentiment === 'POSITIVE'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                        : t.aiAnalysis.sentiment === 'NEGATIVE'
                        ? 'bg-rose-950 text-rose-400 border-rose-700'
                        : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> {t.aiAnalysis.sentiment}
                  </span>
                )}
              </div>

              {/* Right Column: Date & Meta */}
              <div className="flex md:flex-col items-center md:items-end justify-between text-xs text-slate-400 shrink-0">
                <span className="font-mono text-[11px]">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MessageSquare className="w-3 h-3" /> {(t as any)._count?.comments || 0}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Pagination Footer */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400 shadow-md">
          <div>
            Showing <span className="font-semibold text-white">{tickets.length}</span> of{' '}
            <span className="font-semibold text-white">{total}</span> total tickets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Support Ticket */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" /> Create Support Ticket
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer *</label>
                <select
                  required
                  value={createData.customerId}
                  onChange={(e) => setCreateData({ ...createData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Customer Account</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={createData.subject}
                  onChange={(e) => setCreateData({ ...createData, subject: e.target.value })}
                  placeholder="e.g. Shipment tracking telemetry missing for 48h"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Priority</label>
                  <select
                    value={createData.priority}
                    onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={createData.category}
                    onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="BILLING">BILLING</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="DELIVERY">DELIVERY</option>
                    <option value="ACCOUNT">ACCOUNT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description * (AI analyzes this context)
                </label>
                <textarea
                  rows={4}
                  required
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Provide full issue details. The AI background worker will automatically extract sentiment, summary, priority, and draft replies upon creation."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Queuing Ticket...
                    </>
                  ) : (
                    <>
                      Create &amp; AI Queue <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Detailed Ticket View & Live AI Triaging Panel */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  {selectedTicket.ticketNumber}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">{selectedTicket.subject}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customer: <span className="text-slate-200 font-semibold">{selectedTicket.customer?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Dropdown */}
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="WAITING">WAITING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Ticket Description */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1 text-[10px]">
                  Original Issue Description:
                </span>
                {selectedTicket.description}
              </div>

              {/* AI Structured Analysis Widget */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/40 shadow-xl space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        AI Operational Triaging Report
                        {selectedTicket.aiAnalysis && (
                          <span className="text-[10px] font-mono text-indigo-300 font-normal">
                            ({selectedTicket.aiAnalysis.provider} • {selectedTicket.aiAnalysis.processingTimeMs}ms)
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">Validated against strict Zod Schema</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRunAiAnalysis(selectedTicket.id)}
                    disabled={aiAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiAnalyzing ? 'animate-spin text-cyan-400' : ''}`} />
                    {aiAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                  </button>
                </div>

                {selectedTicket.aiAnalysis ? (
                  <div className="space-y-4 pt-2">
                    {/* Sentiment & Recommendations Pills */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block font-semibold">Customer Sentiment</span>
                        <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-200">
                          {selectedTicket.aiAnalysis.sentiment === 'POSITIVE' && <Smile className="w-4 h-4 text-emerald-400" />}
                          {selectedTicket.aiAnalysis.sentiment === 'NEUTRAL' && <Meh className="w-4 h-4 text-slate-400" />}
                          {selectedTicket.aiAnalysis.sentiment === 'NEGATIVE' && <Frown className="w-4 h-4 text-rose-400" />}
                          <span className={selectedTicket.aiAnalysis.sentiment === 'NEGATIVE' ? 'text-rose-400' : selectedTicket.aiAnalysis.sentiment === 'POSITIVE' ? 'text-emerald-400' : 'text-slate-200'}>
                            {selectedTicket.aiAnalysis.sentiment}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block font-semibold">Recommended Priority</span>
                        <span className="font-bold text-amber-400 mt-1 block">
                          {selectedTicket.aiAnalysis.priority}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block font-semibold">Detected Category</span>
                        <span className="font-bold text-cyan-400 mt-1 block">
                          {selectedTicket.aiAnalysis.category}
                        </span>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Executive Summary
                      </span>
                      <p className="text-slate-200 leading-relaxed">{selectedTicket.aiAnalysis.summary}</p>
                    </div>

                    {/* Next Action */}
                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                        ⚡ Recommended Next Operational Action
                      </span>
                      <p className="text-slate-200 leading-relaxed">{selectedTicket.aiAnalysis.nextAction}</p>
                    </div>

                    {/* Suggested Response with 1-Click Copy */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                          AI Suggested Customer Reply
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySuggestedResponse(selectedTicket.aiAnalysis.suggestedResponse)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedResponse ? 'Copied & Inserted!' : '1-Click Insert into Reply'}
                        </button>
                      </div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                        {selectedTicket.aiAnalysis.suggestedResponse}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    AI Analysis pending or running in queue. Click &quot;Re-analyze&quot; to execute immediate inference.
                  </div>
                )}
              </div>

              {/* Conversation & Comments Thread */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  Conversation Thread ({selectedTicket.comments?.length || 0})
                </h3>

                <div className="space-y-2.5">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((cm: any) => (
                      <div
                        key={cm.id}
                        className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                          cm.isInternal
                            ? 'bg-amber-950/15 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950/70 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{cm.user?.name || 'Agent'}</span>
                            {cm.isInternal && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-line">{cm.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-2">No comments or replies yet on this ticket.</p>
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleAddComment} className="pt-3 space-y-2.5">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type your response to the customer or internal team note..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                      />
                      <span>Mark as internal staff note (hidden from customer)</span>
                    </label>

                    <button
                      type="submit"
                      disabled={commentLoading || !commentText.trim()}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                    >
                      {commentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
