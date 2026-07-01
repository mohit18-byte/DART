'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';

const GITHUB_REPO = 'your-org/dart'; // TODO: Replace with real repo

const ASSETS = {
  macos: { file: 'dart-agent-macos', label: 'macOS (Apple Silicon)', icon: '🍎' },
  windows: { file: 'dart-agent-windows.exe', label: 'Windows (x64)', icon: '🪟' },
  linux: { file: 'dart-agent-linux', label: 'Linux (x64)', icon: '🐧' },
} as const;

type OS = keyof typeof ASSETS;

function detectOS(): OS | null {
  if (typeof navigator === 'undefined') return null;
  const uaPlatform = (navigator as any).userAgentData?.platform;
  if (uaPlatform) {
    if (uaPlatform === 'macOS') return 'macos';
    if (uaPlatform === 'Windows') return 'windows';
    if (uaPlatform === 'Linux') return 'linux';
  }
  const platform = navigator.platform?.toLowerCase() ?? '';
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('win')) return 'windows';
  if (platform.includes('linux')) return 'linux';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macos';
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return null;
}

function getDownloadUrl(asset: string) {
  return `https://github.com/${GITHUB_REPO}/releases/latest/download/${asset}`;
}

const INSTRUCTIONS: Record<OS, string[]> = {
  macos: [
    'Download dart-agent-macos',
    'Move to Applications folder',
    'Right-click → Open (bypass Gatekeeper on first run)',
    'Run the installer: ./dart-agent-macos --install',
  ],
  windows: [
    'Download dart-agent-windows.exe',
    'Run the installer',
    'Click "More info" → "Run anyway" (bypass SmartScreen)',
    'Restart Chrome for changes to take effect',
  ],
  linux: [
    'Download dart-agent-linux',
    'Make executable: chmod +x dart-agent-linux',
    'Run installer: ./dart-agent-linux --install',
    'Restart Chrome for changes to take effect',
  ],
};

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<OS | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [expandedOS, setExpandedOS] = useState<OS | null>(null);

  useEffect(() => {
    setDetectedOS(detectOS());

    // Fetch latest version from GitHub
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tag_name) setVersion(data.tag_name);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-24 text-center">
        <h1 className="text-4xl md:text-5xl font-normal leading-[1.1] tracking-[-1px] text-ink mb-4">
          Download Dart Agent
        </h1>
        <p className="text-lg text-body mb-4 max-w-xl mx-auto">
          The native agent enables Dart to control your browser. Install it alongside the Chrome extension.
        </p>
        {version && (
          <p className="text-xs text-muted-soft mb-10">Latest version: {version}</p>
        )}

        {/* Download buttons */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {(Object.keys(ASSETS) as OS[]).map((os) => {
            const asset = ASSETS[os];
            const isPrimary = os === detectedOS;

            return (
              <div key={os}>
                <a
                  href={getDownloadUrl(asset.file)}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
                    isPrimary
                      ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20'
                      : 'bg-surface-card border-hairline hover:border-primary/40'
                  }`}
                >
                  <span className="text-3xl">{asset.icon}</span>
                  <span className={`text-sm font-medium ${isPrimary ? 'text-primary' : 'text-ink'}`}>
                    {asset.label}
                  </span>
                  {isPrimary && (
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-[1px]">
                      Recommended
                    </span>
                  )}
                </a>

                {/* Install instructions toggle */}
                <button
                  onClick={() => setExpandedOS(expandedOS === os ? null : os)}
                  className="mt-2 text-xs text-muted hover:text-ink transition-colors"
                >
                  {expandedOS === os ? 'Hide' : 'View'} install steps
                </button>

                {expandedOS === os && (
                  <ol className="text-left mt-3 space-y-2 text-xs text-body">
                    {INSTRUCTIONS[os].map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-soft font-mono">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>

        {/* Code signing notice */}
        <div className="p-4 rounded-lg bg-surface-card border border-hairline text-left mb-8">
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-body">Note:</strong> Dart isn't code-signed yet — your OS will ask you to approve it once.
            We're working on proper code signing. The binary is open source — you can{' '}
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              inspect the source code
            </a>.
          </p>
        </div>

        {/* Chrome extension */}
        <div className="p-6 rounded-xl bg-surface-card border border-hairline">
          <h3 className="text-base font-semibold text-ink mb-2">Also install the Chrome Extension</h3>
          <p className="text-sm text-body mb-4">
            The extension provides the side panel UI and communicates with the native agent.
          </p>
          <a
            href="#"
            className="inline-flex items-center h-10 px-5 text-sm font-medium bg-ink text-canvas rounded-lg hover:bg-body transition-all"
          >
            Add to Chrome (coming soon)
          </a>
        </div>
      </section>
    </div>
  );
}
