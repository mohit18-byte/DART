import React, { useCallback, useEffect } from 'react';
import { sendToBackground } from '../lib/messaging';
import { useAgentStore } from '../stores/agent-store';

/**
 * ControlBar — Pause / Resume / Cancel buttons.
 * Visible only when a task is running or paused.
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        if (isRunning) handlePause();
        else if (isPaused) handleResume();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, isRunning, isPaused, handleCancel, handlePause, handleResume]);

  if (!isActive) return null;

  return (
    <div className="control-bar">
      {isRunning ? (
        <button className="btn-control btn-pause" onClick={handlePause} title="Pause (Space)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <span>Pause</span>
        </button>
      ) : (
        <button className="btn-control btn-resume" onClick={handleResume} title="Resume (Space)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          <span>Resume</span>
        </button>
      )}
      <button className="btn-control btn-cancel" onClick={handleCancel} title="Cancel (Escape)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span>Cancel</span>
      </button>
    </div>
  );
}
