'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Code,
  Shield,
  Sparkles,
} from 'lucide-react';
import { ActivityLogData } from '@/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(entityTypeFilter && { entityType: entityTypeFilter }),
      });

      const res = await fetch(`/api/audit-logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-indigo-400" /> Security &amp; Operations Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable chronological record of administrative actions, user logins, AI ticket triaging, and entity updates.
          </p>
        </div>

        {/* Filter */}
        <select
          value={entityTypeFilter}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-indigo-500 self-start sm:self-auto"
        >
          <option value="">All Entity Types</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="PRODUCT">PRODUCT</option>
          <option value="TICKET">TICKET</option>
          <option value="AUTH">AUTH</option>
          <option value="USER">USER</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Triggered By</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Loading audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                      {log.action.includes('AI') ? (
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      ) : log.action.includes('AUTH') ? (
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {log.action}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
                        {log.entityType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      {log.user ? (
                        <span>
                          {log.user.name}{' '}
                          <span className="text-[10px] text-slate-500 font-mono">({log.user.role})</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">System Auto-Worker</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      {log.details && (
                        <button
                          onClick={() => setSelectedDetails(log)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold transition"
                        >
                          View Payload
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{logs.length}</span> of{' '}
            <span className="font-semibold text-white">{total}</span> total audit records
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

      {/* JSON Payload Viewer Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" /> Audit Log Event Payload
              </h2>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-slate-400">
                Action: <span className="font-bold text-white">{selectedDetails.action}</span>
              </div>
              <div className="text-slate-400">
                Entity ID: <span className="font-mono text-cyan-400">{selectedDetails.entityId || 'N/A'}</span>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedDetails.details || '{}'), null, 2);
                  } catch {
                    return selectedDetails.details;
                  }
                })()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
