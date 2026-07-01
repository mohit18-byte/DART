import React, { useEffect, useRef } from 'react';
import { useAgentStore } from '../stores/agent-store';
import { StepCard } from './StepCard';

export function StepLog() {
  const { steps } = useAgentStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [steps.length]);

  if (steps.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
      {steps.map((step) => (
        <StepCard key={step.id} step={step} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
