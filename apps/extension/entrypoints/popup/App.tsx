import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAgentStore } from '../../stores/agent-store';
import { cn } from '@/lib/utils';

export function App() {
  const { isConnected, status } = useAgentStore();

  const openSidePanel = async () => {
    const currentWindow = await chrome.windows.getCurrent();
    const wId = currentWindow?.id;
    if (wId != null) {
      await chrome.sidePanel.open({ windowId: wId });
    }
    window.close();
  };

  return (
    <div className="w-[300px] p-4 bg-bg text-ink">
      <div className="flex items-center gap-2 mb-4">
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
        <span className="font-semibold text-[15px] tracking-tight">Dart</span>
      </div>

      <p className="text-[13px] text-body mb-4 leading-relaxed">
        AI browser agent that controls your real browser. Open the side panel to get started.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success' : 'bg-muted-soft')} />
        <span className="text-[12px] text-muted">
          {isConnected ? 'Agent connected' : 'Agent offline'}
        </span>
      </div>

      <Button className="w-full" onClick={openSidePanel}>
        <span>Open Side Panel</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
