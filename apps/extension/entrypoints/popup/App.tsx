import React, { useState, useCallback } from 'react';
import { sendToBackground } from '../../lib/messaging';

export function App() {
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = command.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendToBackground({ type: 'task:start', command: trimmed });
      // Open side panel after submitting
      try {
        const win = await chrome.windows.getCurrent();
        if (win.id != null) {
          await chrome.sidePanel.open({ windowId: win.id });
        }
      } catch {
        // sidePanel.open may not be available in all contexts
      }
      window.close();
    } catch (err) {
      console.error('[Dart Popup] Failed to send command:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [command, isSubmitting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleOpenPanel = useCallback(async () => {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      if (currentWindow.id != null) {
        await chrome.sidePanel.open({ windowId: currentWindow.id });
      }
      window.close();
    } catch {
      // Fallback — side panel open requires user gesture in some contexts
    }
  }, []);

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="popup-logo">
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
          <span className="popup-title">Dart</span>
        </div>
      </div>

      <div className="popup-body">
        <textarea
          className="popup-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What should I do?"
          rows={3}
          disabled={isSubmitting}
          autoFocus
        />

        <div className="popup-actions">
          <button
            className="btn-primary popup-submit"
            onClick={handleSubmit}
            disabled={!command.trim() || isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Run'}
          </button>
        </div>

        <button className="btn-text popup-open-panel" onClick={handleOpenPanel}>
          Open Full Panel →
        </button>
      </div>
    </div>
  );
}
