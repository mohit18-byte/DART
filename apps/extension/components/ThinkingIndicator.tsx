import React from 'react';

/**
 * ThinkingIndicator — shown between steps while Claude is planning.
 * Three-dot pulse animation with subtle text.
 */
export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 animate-fade-in">
      <div className="flex items-center gap-1">
        <span className="w-[6px] h-[6px] rounded-full bg-primary animate-pulse-dot [animation-delay:0ms]" />
        <span className="w-[6px] h-[6px] rounded-full bg-primary animate-pulse-dot [animation-delay:200ms]" />
        <span className="w-[6px] h-[6px] rounded-full bg-primary animate-pulse-dot [animation-delay:400ms]" />
      </div>
      <span className="text-[12px] text-muted font-medium">Dart is thinking…</span>
    </div>
  );
}
