import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                fill="#cc785c"
                stroke="#cc785c"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-semibold text-[17px] tracking-tight text-ink">Dart</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-sm font-medium text-muted hover:text-ink transition-colors">
              Pricing
            </Link>
            <Link href="/download" className="text-sm font-medium text-muted hover:text-ink transition-colors">
              Download
            </Link>
            <Link href="/changelog" className="text-sm font-medium text-muted hover:text-ink transition-colors">
              Changelog
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center h-9 px-4 text-sm font-medium bg-primary text-on-primary rounded-lg hover:bg-primary-hover active:bg-primary-active transition-all"
            >
              Get Dart Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline bg-canvas">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-[1.5px] mb-4">Product</h4>
              <div className="space-y-2.5">
                <Link href="/download" className="block text-sm text-body hover:text-ink transition-colors">Download</Link>
                <Link href="/pricing" className="block text-sm text-body hover:text-ink transition-colors">Pricing</Link>
                <Link href="/changelog" className="block text-sm text-body hover:text-ink transition-colors">Changelog</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-[1.5px] mb-4">Legal</h4>
              <div className="space-y-2.5">
                <span className="block text-sm text-muted-soft">Privacy Policy</span>
                <span className="block text-sm text-muted-soft">Terms of Service</span>
              </div>
            </div>
            <div className="col-span-2 md:col-span-2 md:text-right">
              <div className="flex items-center gap-2 md:justify-end mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#cc785c" stroke="#cc785c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-semibold text-sm text-ink">Dart</span>
              </div>
              <p className="text-xs text-muted-soft leading-relaxed">
                AI browser agent that controls your real browser.<br />
                Built with care. Open source.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
