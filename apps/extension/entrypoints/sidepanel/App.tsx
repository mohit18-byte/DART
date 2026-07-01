import React, { useState, useCallback } from 'react';
import { CommandInput } from '../../components/CommandInput';
import { StepLog } from '../../components/StepLog';
import { ControlBar } from '../../components/ControlBar';
import { Header } from '../../components/Header';
import { ThinkingIndicator } from '../../components/ThinkingIndicator';
import { BlockedCard } from '../../components/BlockedCard';
import { AskUserCard } from '../../components/AskUserCard';
import { TemplateCarousel } from '../../components/TemplateCarousel';
import { TaskHistory } from '../../components/TaskHistory';
import { SettingsPanel } from '../../components/SettingsPanel';
import { useAgentStore } from '../../stores/agent-store';

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { status, steps, connectionError, command } = useAgentStore();

  const isActive = status === 'running' || status === 'paused';
  const isThinking = isActive && steps.length > 0 &&
    steps[steps.length - 1]?.status === 'success' &&
    steps[steps.length - 1]?.type !== 'done';

  // Check for blocked/ask_user states
  const lastStep = steps[steps.length - 1];
  const isBlocked = lastStep?.type === 'blocked' && lastStep?.status === 'failed';
  const isAskUser = lastStep?.type === 'ask_user' && lastStep?.status === 'pending';
  const blockerReason = isBlocked ? (lastStep.detail ?? 'unknown') : undefined;

  const handleTemplateSelect = useCallback((template: string) => {
    // Focus the textarea and fill it
    const event = new CustomEvent('dart:template', { detail: template });
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="relative flex flex-col h-screen bg-bg overflow-hidden">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="flex flex-col flex-1 overflow-hidden">
        <CommandInput />

        {/* Connection error banner */}
        {connectionError && !isActive && (
          <div className="mx-4 mt-2 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-error/10 border border-error/25 animate-fade-in">
            <span className="text-[13px]">⚠️</span>
            <span className="text-[12px] text-error leading-snug">{connectionError}</span>
          </div>
        )}

        {/* Control bar — during active task */}
        <ControlBar />

        {/* Blocked card */}
        {isBlocked && blockerReason && <BlockedCard reason={blockerReason} description={lastStep.description} />}

        {/* Ask user card */}
        {isAskUser && lastStep && <AskUserCard question={lastStep.description.replace('Question: ', '')} stepId={lastStep.id} />}

        {/* Step log — during active task or when steps exist */}
        {(isActive || steps.length > 0) && <StepLog />}

        {/* Thinking indicator */}
        {isThinking && <ThinkingIndicator />}

        {/* Empty state */}
        {!isActive && steps.length === 0 && !connectionError && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center px-6 mb-4 animate-fade-in">
              <div className="mx-auto mb-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto opacity-30">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                  <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink mb-1">Ready to assist</p>
              <p className="text-[12px] text-muted leading-relaxed">
                Type a command or pick a template below to get started
              </p>
            </div>

            <TemplateCarousel onSelect={handleTemplateSelect} />
          </div>
        )}

        {/* Task history — after task completes */}
        {!isActive && steps.length > 0 && <TaskHistory />}
      </main>

      {/* Settings panel overlay */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
