import React, { useCallback, useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { Button } from './ui/button';
import { sendToBackground } from '../lib/messaging';
import { useAgentStore } from '../stores/agent-store';

/**
 * ControlBar — Pause/Resume + Cancel controls.
 * Keyboard shortcuts: Space = pause/resume, Escape = cancel.
 */
export function ControlBar() {
  const { status, taskId } = useAgentStore();
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isActive = isRunning || isPaused;

  const handlePause = useCallback(async () => {
    if (!taskId) return;
    await sendToBackground({ type: 'task:pause', taskId });
  }, [taskId]);

  const handleResume = useCallback(async () => {
    if (!taskId) return;
    await sendToBackground({ type: 'task:resume', taskId });
  }, [taskId]);

  const handleCancel = useCallback(async () => {
    if (!taskId) return;
    await sendToBackground({ type: 'task:cancel', taskId });
  }, [taskId]);

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        isRunning ? handlePause() : handleResume();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, isRunning, handleCancel, handlePause, handleResume]);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 shrink-0">
      {isRunning ? (
        <Button variant="outline" size="sm" className="flex-1" onClick={handlePause}>
          <Pause className="w-3.5 h-3.5" />
          <span>Pause</span>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="flex-1" onClick={handleResume}>
          <Play className="w-3.5 h-3.5" />
          <span>Resume</span>
        </Button>
      )}
      <Button variant="destructive" size="sm" className="flex-1" onClick={handleCancel}>
        <X className="w-3.5 h-3.5" />
        <span>Cancel</span>
      </Button>
    </div>
  );
}
