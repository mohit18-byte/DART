import React from 'react';
import { CommandInput } from '../../components/CommandInput';
import { StepLog } from '../../components/StepLog';
import { Header } from '../../components/Header';
import { useAgentStore } from '../../stores/agent-store';

export function App() {
  const { status, steps } = useAgentStore();
  const isActive = status === 'running' || status === 'paused';

  return (
    <div className="app-container">
      <Header />
      <main className="app-main">
        <CommandInput />
        {(isActive || steps.length > 0) && <StepLog />}
        {!isActive && steps.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
                <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <p className="empty-state-title">Ready to assist</p>
            <p className="empty-state-subtitle">
              Type a command like <em>&ldquo;Go to twitter.com and post a tweet&rdquo;</em> to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
