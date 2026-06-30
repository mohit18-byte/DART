import React, { useRef, useEffect } from 'react';
import { useAgentStore } from '../stores/agent-store';
import { StepCard } from './StepCard';

export function StepLog() {
  const { steps } = useAgentStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [steps.length]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="step-log">
      <div className="step-log-header">
        <span className="step-log-title">Steps</span>
        <span className="step-log-count">{steps.length}</span>
      </div>
      <div className="step-log-list">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
