import React, { useState, useCallback, useRef, useEffect } from 'react';
import { sendToBackground } from '../lib/messaging';
import { useAgentStore } from '../stores/agent-store';

const EXAMPLE_COMMANDS = [
  'Go to twitter.com and post a tweet saying hello world',
  'Summarize the top posts on Reddit today',
  'Search LinkedIn for software engineers in San Francisco',
  'Add a meeting to my Google Calendar for tomorrow at 2pm',
  'Check my latest Amazon order status',
  'Reply to my last email from Sarah',
];

export function CommandInput() {
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { status, setCommand: storeSetCommand, setStatus } = useAgentStore();

  const isRunning = status === 'running' || status === 'paused';

  // Cycle placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_COMMANDS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [command]);

  const handleSubmit = useCallback(async () => {
    const trimmed = command.trim();
    if (!trimmed || isSubmitting || isRunning) return;

    setIsSubmitting(true);
    try {
      storeSetCommand(trimmed);
      setStatus('running');
      await sendToBackground({ type: 'task:start', command: trimmed });
      setCommand('');
    } catch (err) {
      console.error('[Dart] Failed to send command:', err);
      setStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [command, isSubmitting, isRunning, storeSetCommand, setStatus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="command-input-container">
      <div className="command-input-wrapper">
        <textarea
          ref={textareaRef}
          className="command-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={EXAMPLE_COMMANDS[placeholderIndex]}
          rows={1}
          disabled={isRunning}
          autoFocus
        />
        <div className="command-input-footer">
          <span className="command-char-count">
            {command.length > 0 ? `${command.length}` : ''}
          </span>
          <button
            className="btn-primary command-submit"
            onClick={handleSubmit}
            disabled={!command.trim() || isSubmitting || isRunning}
          >
            {isSubmitting ? (
              <span className="spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
      {isRunning && (
        <p className="command-running-hint">
          Task is running. Press Escape to cancel.
        </p>
      )}
    </div>
  );
}
