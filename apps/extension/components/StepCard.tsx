import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { StepEvent } from '@dart/shared';
import {
  Globe,
  MousePointerClick,
  Type,
  ArrowUpDown,
  FileText,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Brain,
  AlertTriangle,
  Loader2,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';

// ── Action type icon mapping ──
const ACTION_ICON: Record<string, React.ElementType> = {
  navigate: Globe,
  click: MousePointerClick,
  type: Type,
  scroll: ArrowUpDown,
  extract: FileText,
  done: CheckCircle2,
  ask_user: HelpCircle,
  blocked: ShieldAlert,
  thinking: Brain,
  error: AlertTriangle,
};

// ── Action type color mapping (left border) ──
const ACTION_BORDER_COLOR: Record<string, string> = {
  navigate: 'border-l-info',
  click: 'border-l-primary',
  type: 'border-l-amber',
  scroll: 'border-l-muted',
  extract: 'border-l-success',
  done: 'border-l-success',
  ask_user: 'border-l-info',
  blocked: 'border-l-warning',
  thinking: 'border-l-primary',
  error: 'border-l-error',
};

// ── Relative time ──
function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

interface StepCardProps {
  step: StepEvent;
}

export function StepCard({ step }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ACTION_ICON[step.type] ?? AlertTriangle;
  const borderColor = ACTION_BORDER_COLOR[step.type] ?? 'border-l-muted';
  const hasDetail = !!step.detail;

  return (
    <div
      className={cn(
        'bg-surface border border-hairline rounded-lg border-l-[3px] animate-slide-up',
        borderColor,
        hasDetail && 'cursor-pointer',
      )}
      onClick={() => hasDetail && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          <Icon className={cn('w-4 h-4', step.status === 'failed' ? 'text-error' : 'text-muted')} />
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-body leading-snug">{step.description}</p>
          {step.duration != null && step.status === 'success' && (
            <span className="text-[11px] text-muted-soft mt-0.5 inline-block">{step.duration}ms</span>
          )}
        </div>

        {/* Right: status + time + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-soft tabular-nums whitespace-nowrap">
            {formatRelativeTime(step.timestamp)}
          </span>

          {/* Status indicator */}
          {step.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
          {step.status === 'success' && <Check className="w-3.5 h-3.5 text-success" />}
          {step.status === 'failed' && <X className="w-3.5 h-3.5 text-error" />}
          {step.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-warning animate-spin" />}

          {hasDetail && (
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-muted transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          )}
        </div>
      </div>

      {/* Expandable detail panel */}
      {hasDetail && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="px-3 pb-2.5 pt-0 border-t border-hairline-soft mx-3">
            <p className="text-[12px] text-muted leading-relaxed mt-2 font-mono break-all">
              {step.detail}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
