import React, { useState } from 'react';
import { ChevronDown, Check, X, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '../stores/agent-store';
import type { TaskStatus } from '@dart/shared';

// ── Status icon mapping ──
const STATUS_ICON: Record<TaskStatus, React.ElementType> = {
  completed: Check,
  failed: X,
  cancelled: AlertTriangle,
  running: Loader2,
  paused: Clock,
  pending: Clock,
};
const STATUS_COLOR: Record<TaskStatus, string> = {
  completed: 'text-success',
  failed: 'text-error',
  cancelled: 'text-warning',
  running: 'text-primary',
  paused: 'text-amber',
  pending: 'text-muted',
};

interface TaskHistoryItem {
  id: string;
  command: string;
  status: TaskStatus;
  stepCount: number;
  timestamp: number;
}

function formatRelativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function TaskHistory() {
  const [isOpen, setIsOpen] = useState(false);
  // Phase 4: local history from Zustand. Phase 5: Supabase.
  const { steps, command, status } = useAgentStore();

  // Build a simple task history from current session state
  const history: TaskHistoryItem[] = [];
  if (command && (status === 'completed' || status === 'failed' || status === 'cancelled')) {
    history.push({
      id: '1',
      command,
      status,
      stepCount: steps.length,
      timestamp: steps[0]?.timestamp ?? Date.now(),
    });
  }

  return (
    <div className="px-4 pb-4">
      <button
        className="flex items-center justify-between w-full py-2 text-[11px] font-semibold text-muted-soft uppercase tracking-[1.5px] hover:text-muted transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Task History</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="animate-slide-up">
          {history.length === 0 ? (
            <p className="text-[12px] text-muted-soft py-3 text-center">
              No tasks yet. Try one of the templates above!
            </p>
          ) : (
            <div className="space-y-1.5">
              {history.map((task) => {
                const StatusIcon = STATUS_ICON[task.status];
                const statusColor = STATUS_COLOR[task.status];

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-md bg-surface border border-hairline"
                  >
                    <StatusIcon className={cn('w-3.5 h-3.5 shrink-0', statusColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-body truncate">{task.command}</p>
                      <p className="text-[11px] text-muted-soft mt-0.5">
                        {task.stepCount} steps · {formatRelativeTime(task.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
