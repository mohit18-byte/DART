import React, { useCallback } from 'react';
import { ShieldAlert, Smartphone, Clock, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { sendToBackground } from '../lib/messaging';
import { useAgentStore } from '../stores/agent-store';

const BLOCKER_CONFIG: Record<string, { icon: React.ElementType; title: string; instruction: string }> = {
  captcha: {
    icon: ShieldAlert,
    title: 'CAPTCHA detected',
    instruction: 'Solve the challenge in your browser, then click Resume.',
  },
  '2fa': {
    icon: Smartphone,
    title: 'Verification required',
    instruction: 'Complete two-factor authentication in your browser, then click Resume.',
  },
  rate_limit: {
    icon: Clock,
    title: 'Rate limited',
    instruction: 'The website is throttling requests. Wait a moment, then click Resume.',
  },
  login_required: {
    icon: LogIn,
    title: 'Login required',
    instruction: 'Please log in to this website in your browser, then click Resume.',
  },
};

interface BlockedCardProps {
  reason: string;
  description?: string;
}

export function BlockedCard({ reason, description }: BlockedCardProps) {
  const { taskId } = useAgentStore();
  const config = BLOCKER_CONFIG[reason] ?? BLOCKER_CONFIG['captcha']!;
  const Icon = config!.icon;

  const handleResume = useCallback(async () => {
    if (!taskId) return;
    await sendToBackground({ type: 'task:resume', taskId });
  }, [taskId]);

  return (
    <div className="mx-4 my-2 rounded-lg border-2 border-amber/40 bg-amber/5 p-4 animate-pulse-border">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber/10 shrink-0">
          <Icon className="w-5 h-5 text-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-ink">{config!.title}</h4>
          {description && (
            <p className="text-[12px] text-muted mt-1 leading-relaxed">{description}</p>
          )}
          <p className="text-[12px] text-body mt-1.5">{config!.instruction}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3 border-amber/40 text-amber hover:bg-amber/10"
        onClick={handleResume}
      >
        Resume Task
      </Button>
    </div>
  );
}
