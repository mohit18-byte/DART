import React from 'react';
import { X, ExternalLink, Zap, Crown } from 'lucide-react';
import { Button } from './ui/button';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  // Phase 4: hardcoded. Phase 5: from Clerk metadata.
  const plan = 'free';
  const tasksUsed = 0;
  const tasksLimit = 5;
  const version = '0.1.0';

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-bg/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-[280px] bg-surface border-l border-hairline shadow-xl animate-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-hairline shrink-0">
          <span className="font-semibold text-sm text-ink">Settings</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Plan Info */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-soft uppercase tracking-[1.5px] mb-3">Your Plan</h3>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-elevated border border-hairline">
              {plan === 'free' ? (
                <Zap className="w-5 h-5 text-primary" />
              ) : (
                <Crown className="w-5 h-5 text-amber" />
              )}
              <div>
                <p className="text-sm font-medium text-ink capitalize">{plan}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  {tasksUsed}/{tasksLimit} tasks used today
                </p>
              </div>
            </div>

            {plan === 'free' && (
              <a
                href="https://dart.app/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2.5 text-[12px] font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <span>Upgrade to Pro</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </section>

          {/* Usage */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-soft uppercase tracking-[1.5px] mb-3">Daily Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-muted">Tasks</span>
                <span className="text-body tabular-nums">{tasksUsed} / {tasksLimit}</span>
              </div>
              <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((tasksUsed / tasksLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </section>

          {/* Model */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-soft uppercase tracking-[1.5px] mb-3">AI Model</h3>
            <div className="p-3 rounded-lg bg-surface-elevated border border-hairline">
              <p className="text-sm text-ink font-medium">
                {plan === 'free' ? 'Gemini Flash 2.0' : 'Claude Sonnet 4'}
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                {plan === 'free' ? 'Fast responses, basic accuracy' : 'High accuracy, complex tasks'}
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-hairline text-center">
          <span className="text-[11px] text-muted-soft">Dart v{version}</span>
        </div>
      </div>
    </div>
  );
}
