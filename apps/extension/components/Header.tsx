import React from 'react';
import { Settings, Wifi, WifiOff } from 'lucide-react';
import { useAgentStore } from '../stores/agent-store';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { isConnected } = useAgentStore();

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-hairline bg-surface shrink-0">
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="var(--color-primary)"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-semibold text-[15px] tracking-tight text-ink">Dart</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status */}
        <div className="flex items-center gap-1.5" title={isConnected ? 'Connected' : 'Offline'}>
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-success" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-muted-soft" />
          )}
          <span className={cn('text-[11px] font-medium', isConnected ? 'text-success' : 'text-muted-soft')}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
