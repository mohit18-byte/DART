import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dart — Your AI Assistant That Actually Uses Your Browser',
  description: 'Give natural language commands and watch Dart execute them step by step in your real browser. Already logged in, fully private, completely transparent.',
};

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-8">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
            </svg>
            Now in Public Alpha
          </div>

          <h1 className="text-5xl md:text-6xl font-normal leading-[1.05] tracking-[-1.5px] text-ink mb-6">
            Your AI Assistant That<br />
            <span className="text-primary">Actually Uses Your Browser</span>
          </h1>

          <p className="text-lg text-body max-w-2xl mx-auto mb-10 leading-relaxed">
            Give natural language commands and watch Dart execute them step by step —
            in your real browser, with your real logins, completely transparent.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/download"
              className="inline-flex items-center h-12 px-8 text-[15px] font-medium bg-primary text-on-primary rounded-xl hover:bg-primary-hover active:bg-primary-active transition-all shadow-lg shadow-primary/20"
            >
              Get Dart Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center h-12 px-8 text-[15px] font-medium bg-canvas text-ink border border-hairline rounded-xl hover:bg-surface-card transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Gradient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-linear-to-b from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ── Feature Blocks ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-8 rounded-xl bg-surface-card border border-hairline">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc785c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Your Real Browser</h3>
            <p className="text-sm text-body leading-relaxed">
              Dart runs in your actual Chrome browser — not a sandbox or VM.
              Your data never leaves your machine.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-xl bg-surface-card border border-hairline">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc785c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Already Logged In</h3>
            <p className="text-sm text-body leading-relaxed">
              No need to share passwords. Dart uses your existing sessions —
              Gmail, Twitter, LinkedIn, everything.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-xl bg-surface-card border border-hairline">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cc785c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Watch It Work</h3>
            <p className="text-sm text-body leading-relaxed">
              Every action is visible in real time. Pause, resume, or cancel
              anytime. You're always in control.
            </p>
          </div>
        </div>
      </section>

      {/* ── Social Proof Placeholder ── */}
      <section className="border-t border-hairline bg-canvas">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-sm font-medium text-muted-soft uppercase tracking-[1.5px] mb-4">Trusted by early adopters</p>
          <p className="text-2xl font-semibold text-ink">
            Join 500+ users automating their browser with AI
          </p>
        </div>
      </section>
    </div>
  );
}
