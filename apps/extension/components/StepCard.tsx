import React from 'react';
import type { StepEvent } from '@dart/shared';

interface StepCardProps {
  step: StepEvent;
}

const ACTION_ICONS: Record<string, string> = {
  navigate: '🧭',
  click: '👆',
  type: '⌨️',
  scroll: '📜',
  extract: '📋',
  done: '✅',
  blocked: '🚫',
  ask_user: '❓',
  thinking: '🧠',
  error: '❌',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'step-status-pending',
  running: 'step-status-running',
  success: 'step-status-success',
  failed: 'step-status-failed',
};

function formatTimestamp(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export function StepCard({ step }: StepCardProps) {
  const icon = ACTION_ICONS[step.type] ?? '⚡';
  const statusClass = STATUS_CLASS[step.status] ?? '';

  return (
    <div className={`step-card ${statusClass}`}>
      <div className="step-card-header">
        <span className="step-icon">{icon}</span>
        <span className="step-description">{step.description}</span>
        <span className="step-timestamp">{formatTimestamp(step.timestamp)}</span>
      </div>
      <div className="step-card-status">
        {step.status === 'running' && <span className="spinner-small" />}
        {step.status === 'success' && <span className="step-check">✓</span>}
        {step.status === 'failed' && <span className="step-fail">✗</span>}
      </div>
      {step.detail && (
        <div className="step-detail">
          <p>{step.detail}</p>
        </div>
      )}
    </div>
  );
}
