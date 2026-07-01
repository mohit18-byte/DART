'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  command: string;
  status: string;
  stepCount: number;
  result: string | null;
  modelUsed: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-[#5db872]/10 text-[#5db872]' },
  failed: { label: 'Failed', className: 'bg-[#c64545]/10 text-[#c64545]' },
  cancelled: { label: 'Cancelled', className: 'bg-[#d4a017]/10 text-[#d4a017]' },
  running: { label: 'Running', className: 'bg-[#cc785c]/10 text-[#cc785c]' },
  paused: { label: 'Paused', className: 'bg-[#e8a55a]/10 text-[#e8a55a]' },
  pending: { label: 'Pending', className: 'bg-[#6c6a64]/10 text-[#6c6a64]' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const plan = (user?.publicMetadata?.plan as string) ?? 'free';
  const planLimits: Record<string, number> = { free: 5, pro: 30, power: 100 };
  const limit = planLimits[plan] ?? 5;

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks(cursor?: string) {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/task/history?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setTasks((prev) => cursor ? [...prev, ...data.items] : data.items);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  // Count today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTasks = tasks.filter((t) => new Date(t.createdAt) >= today).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Welcome back, {user?.firstName ?? 'there'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-surface-card border border-hairline">
          <p className="text-xs font-semibold text-muted uppercase tracking-[1px] mb-1.5">Tasks Today</p>
          <p className="text-2xl font-semibold text-ink tabular-nums">{todayTasks} / {limit}</p>
          <div className="h-1.5 bg-hairline-soft rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((todayTasks / limit) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-hairline">
          <p className="text-xs font-semibold text-muted uppercase tracking-[1px] mb-1.5">Total Tasks</p>
          <p className="text-2xl font-semibold text-ink tabular-nums">{tasks.length}</p>
        </div>

        <div className="p-5 rounded-xl bg-surface-card border border-hairline">
          <p className="text-xs font-semibold text-muted uppercase tracking-[1px] mb-1.5">Plan</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-ink capitalize">{plan}</p>
            {plan === 'free' && (
              <Link
                href="/pricing"
                className="text-[11px] font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Task History Table */}
      <div className="rounded-xl border border-hairline overflow-hidden">
        <div className="px-5 py-3.5 border-b border-hairline bg-surface-card/50">
          <h2 className="text-sm font-semibold text-ink">Task History</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-5 h-5 border-2 border-hairline border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted mt-3">Loading tasks…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">No tasks yet. Run your first task from the Chrome extension!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-[1px]">Command</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-[1px]">Status</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-[1px]">Steps</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-muted uppercase tracking-[1px]">Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE['pending'];
                return (
                  <tr key={task.id} className="border-b border-hairline last:border-0 hover:bg-surface-card/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-ink truncate max-w-[300px]">{task.command}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${badge!.className}`}>
                        {badge!.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted tabular-nums">{task.stepCount}</td>
                    <td className="px-5 py-3.5 text-sm text-muted">{formatDate(task.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {hasMore && (
          <div className="p-4 text-center border-t border-hairline">
            <button
              onClick={() => nextCursor && fetchTasks(nextCursor)}
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
