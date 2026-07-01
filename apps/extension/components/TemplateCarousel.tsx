import React from 'react';
import { Globe, MessageSquare, Mail, Search, Calendar, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  { icon: MessageSquare, text: 'Post a tweet about…', color: 'text-info' },
  { icon: Globe, text: 'Summarize top posts on Reddit', color: 'text-primary' },
  { icon: Mail, text: 'Reply to my last email from…', color: 'text-success' },
  { icon: Search, text: 'Search LinkedIn for…', color: 'text-amber' },
  { icon: Calendar, text: 'Add event to Google Calendar', color: 'text-info' },
  { icon: Package, text: 'Check my Amazon order status', color: 'text-primary' },
];

interface TemplateCarouselProps {
  onSelect: (command: string) => void;
}

export function TemplateCarousel({ onSelect }: TemplateCarouselProps) {
  return (
    <div className="px-4 pt-3">
      <p className="text-[11px] font-semibold text-muted-soft uppercase tracking-[1.5px] mb-2.5">
        Try a template
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.text}
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-hairline bg-surface',
                'hover:bg-surface-hover hover:border-hairline-soft transition-all duration-150',
                'shrink-0 max-w-[200px] cursor-pointer group',
              )}
              style={{ scrollSnapAlign: 'start' }}
              onClick={() => onSelect(template.text)}
            >
              <Icon className={cn('w-4 h-4 shrink-0 transition-colors', template.color, 'group-hover:opacity-80')} />
              <span className="text-[12px] text-body group-hover:text-ink transition-colors whitespace-nowrap text-ellipsis overflow-hidden">
                {template.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
