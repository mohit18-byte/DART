import React, { useEffect, useState } from 'react';
import { useAuth, useUser, SignIn } from '@clerk/chrome-extension';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

/**
 * AuthGate — wraps the agent UI.
 * Shows sign-in screen if not authenticated, agent UI if authenticated.
 *
 * Auth flow:
 * 1. User clicks "Sign in with Google" → opens web app in new tab for OAuth
 * 2. Clerk session syncs back to extension via syncHost
 * 3. Side panel auto-refreshes via chrome.storage.onChanged listener
 */

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [showRefreshHint, setShowRefreshHint] = useState(false);

  // Listen for Clerk session changes via chrome.storage
  useEffect(() => {
    if (isSignedIn) return;

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      // Clerk stores session data in chrome.storage
      const hasSessionChange = Object.keys(changes).some(
        (key) => key.includes('clerk') || key.includes('session'),
      );
      if (hasSessionChange) {
        window.location.reload();
      }
    };

    chrome.storage.local.onChanged.addListener(listener);

    // Fallback: show refresh hint after 5 seconds
    const timeout = setTimeout(() => setShowRefreshHint(true), 5000);

    return () => {
      chrome.storage.local.onChanged.removeListener(listener);
      clearTimeout(timeout);
    };
  }, [isSignedIn]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-5 h-5 border-2 border-hairline border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg px-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-6">
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            fill="var(--color-primary)"
            stroke="var(--color-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <h2 className="text-lg font-semibold text-ink mb-2">Welcome to Dart</h2>
        <p className="text-sm text-muted text-center mb-6 leading-relaxed">
          Sign in to start automating your browser with AI.
        </p>

        <Button
          className="w-full mb-3"
          onClick={() => {
            // Open the web app sign-in in a new tab
            const syncHost = import.meta.env.WXT_SYNC_HOST ?? 'http://localhost:3000';
            chrome.tabs.create({ url: `${syncHost}/dashboard` });
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" className="mr-2">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.1 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.2 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5 0 9.7-1.8 13.2-5l-6.1-5.2C29.2 35.2 26.7 36 24 36c-5.4 0-9.9-3-12.3-7.3l-6.5 5C8.5 39.9 15.7 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.1 5.2C36.7 39.4 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
          </svg>
          Continue with Google
        </Button>

        {showRefreshHint && (
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-muted hover:text-ink transition-colors mt-2"
          >
            Already signed in? Click to refresh
          </button>
        )}
      </div>
    );
  }

  // Signed in — render agent UI
  return <>{children}</>;
}
