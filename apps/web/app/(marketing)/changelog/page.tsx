import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog — Dart',
  description: 'See what\'s new in Dart. Latest updates and improvements.',
};

interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: 'added' | 'improved' | 'fixed'; text: string }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: 'July 2026',
    changes: [
      { type: 'added', text: 'Chrome extension with side panel UI' },
      { type: 'added', text: 'Native messaging host for browser control via CDP' },
      { type: 'added', text: 'AI-powered planning with Claude Sonnet 4 and Gemini Flash 2.0' },
      { type: 'added', text: 'Step-by-step execution with real-time UI updates' },
      { type: 'added', text: 'Blocker detection for CAPTCHAs, 2FA, and rate limits' },
      { type: 'added', text: 'Human-like pacing between actions' },
      { type: 'added', text: 'Task history and settings panel' },
      { type: 'added', text: 'Content script overlay highlighting interacted elements' },
      { type: 'added', text: 'Rate limiting per plan tier (free: 5/day, pro: 30/day, power: 100/day)' },
      { type: 'added', text: 'Marketing site with pricing and download pages' },
    ],
  },
];

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  added: { label: 'Added', className: 'bg-success/10 text-success' },
  improved: { label: 'Improved', className: 'bg-info/10 text-info' },
  fixed: { label: 'Fixed', className: 'bg-warning/10 text-warning' },
};

export default function ChangelogPage() {
  return (
    <div>
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-24">
        <h1 className="text-4xl md:text-5xl font-normal leading-[1.1] tracking-[-1px] text-ink mb-4 text-center">
          Changelog
        </h1>
        <p className="text-lg text-body text-center mb-16">
          What's new in Dart. Every update, documented.
        </p>

        <div className="space-y-12">
          {CHANGELOG.map((entry) => (
            <article key={entry.version} className="relative pl-8 border-l-2 border-hairline">
              {/* Version dot */}
              <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-canvas" />

              <div className="mb-4">
                <h2 className="text-xl font-semibold text-ink">v{entry.version}</h2>
                <p className="text-sm text-muted mt-0.5">{entry.date}</p>
              </div>

              <ul className="space-y-2.5">
                {entry.changes.map((change, i) => {
                  const badge = TYPE_BADGE[change.type];
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge!.className} shrink-0 mt-0.5 uppercase tracking-wide`}>
                        {badge!.label}
                      </span>
                      <span className="text-sm text-body">{change.text}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
