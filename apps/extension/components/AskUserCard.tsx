import React, { useState, useCallback, useRef } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from './ui/button';
import { sendToBackground } from '../lib/messaging';
import { useAgentStore } from '../stores/agent-store';

interface AskUserCardProps {
  question: string;
  stepId: string;
}

export function AskUserCard({ question, stepId }: AskUserCardProps) {
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { taskId } = useAgentStore();

  const handleSubmit = useCallback(async () => {
    if (!response.trim() || !taskId) return;
    setSubmitted(true);
    await sendToBackground({
      type: 'user:response',
      taskId,
      response: response.trim(),
    });
  }, [response, taskId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="mx-4 my-2 rounded-lg border border-info/30 bg-info/5 p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-info/10 shrink-0">
          <MessageCircle className="w-5 h-5 text-info" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-ink">Dart needs your input</h4>
          <p className="text-[13px] text-body mt-1.5 leading-relaxed">{question}</p>
        </div>
      </div>

      {!submitted ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response…"
            autoFocus
            className="flex-1 h-8 px-3 text-sm bg-surface border border-hairline rounded-md text-ink placeholder:text-muted-soft outline-none focus:border-info focus:ring-2 focus:ring-info/20 transition-all"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!response.trim()}
            className="h-8"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-muted">
          <span className="text-success">✓</span>
          <span>Response sent: "{response}"</span>
        </div>
      )}
    </div>
  );
}
