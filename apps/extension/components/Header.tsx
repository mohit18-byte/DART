import React from 'react';
import { useAgentStore } from '../stores/agent-store';

export function Header() {
  const { isConnected, connectionError } = useAgentStore();

  return (
    <header className="header">
      <div className="header-left">
        <svg
          className="header-logo"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="var(--color-primary)"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="header-title">Dart</span>
      </div>
      <div className="header-right">
        <div
          className="connection-indicator"
          title={
            isConnected
              ? 'Connected to native agent'
              : connectionError ?? 'Native agent not connected'
          }
        >
          <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="connection-label">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
