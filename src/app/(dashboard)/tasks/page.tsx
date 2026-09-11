'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string | null;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    dueDate: '',
    assignedToUserId: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/tasks?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          assignedToUserId: formData.assignedToUserId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      setIsCreateOpen(false);
      setFormData({
        title: '',
        description: '',
        status: 'PENDING',
        dueDate: '',
        assignedToUserId: '',
      });
      fetchTasks();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          assignedToUserId: formData.assignedToUserId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setIsEditOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error updating task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete task');
      } else {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const openEditModal = (task: TaskItem) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      assignedToUserId: task.assignedToUserId || '',
    });
    setIsEditOpen(true);
  };

  // Metrics
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-cyan-400" />
            Operations Task Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track, assign, and organize daily operational workflows and background action items.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              status: 'PENDING',
              dueDate: '',
              assignedToUserId: '',
            });
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Filtered</p>
            <p className="text-2xl font-bold text-white mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Pending</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">In Progress</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <div className="flex gap-1.5">
            {['', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
              const label = status === '' ? 'All' : status.replace('_', ' ');
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No operational tasks found</p>
            <p className="text-xs text-slate-500 mt-1">
              Create a new task or adjust your search filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Task Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 max-w-xs md:max-w-md">
                      <p className="font-semibold text-white text-sm">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <option value="PENDING" className="bg-slate-900 text-amber-400">
                          PENDING
                        </option>
                        <option value="IN_PROGRESS" className="bg-slate-900 text-blue-400">
                          IN PROGRESS
                        </option>
                        <option value="COMPLETED" className="bg-slate-900 text-emerald-400">
                          COMPLETED
                        </option>
                      </select>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs">
                      {task.dueDate ? (
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">No deadline</span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs">
                      {task.assignedToUser ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                            {task.assignedToUser.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-slate-200">{task.assignedToUser.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && tasks.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min(page * 10, total)}</span> of{' '}
              <span className="font-semibold text-slate-200">{total}</span> tasks
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-cyan-400" />
                {isCreateOpen ? 'Create Operations Task' : 'Edit Task'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isCreateOpen ? handleCreateTask : handleUpdateTask} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit delivery batch #401"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Task details and instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreateOpen ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
