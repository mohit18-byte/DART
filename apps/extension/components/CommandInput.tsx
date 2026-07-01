import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { sendToBackground } from '../lib/messaging';
import { useAgentStore } from '../stores/agent-store';
import { cn } from '@/lib/utils';

const EXAMPLE_COMMANDS = [
  'Go to twitter.com and post a tweet saying hello world',
  'Summarize the top posts on Reddit today',
  'Search LinkedIn for software engineers in SF',
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
    <div className="shrink-0 px-4 pt-4">
      <div
        className={cn(
          'flex flex-col bg-surface border border-hairline rounded-xl p-3 transition-all duration-200',
          'focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--color-primary-muted)]',
          isRunning && 'opacity-60',
        )}
      >
        <textarea
          ref={textareaRef}
          className="w-full bg-transparent border-none outline-none text-ink font-(--font-sans) text-sm leading-relaxed resize-none min-h-[24px] max-h-[120px] placeholder:text-muted-soft placeholder:transition-opacity"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={EXAMPLE_COMMANDS[placeholderIndex]}
          rows={1}
          disabled={isRunning}
          autoFocus
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-soft tabular-nums">
            {command.length > 0 ? `${command.length}` : ''}
          </span>

          <button
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150',
              command.trim() && !isSubmitting && !isRunning
                ? 'bg-primary text-on-primary hover:bg-primary-hover active:scale-95'
                : 'bg-surface-elevated text-muted-soft cursor-not-allowed',
            )}
            onClick={handleSubmit}
            disabled={!command.trim() || isSubmitting || isRunning}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
