import type { Stagehand } from '@browserbasehq/stagehand';
import type { PageObservation } from './observer';

/**
 * Blocker detection — heuristic checks for CAPTCHAs, 2FA,
 * rate limits, and login walls.
 *
 * Runs after each page observation to detect situations
 * where the agent cannot proceed without user intervention.
 */

export type BlockerReason = 'captcha' | '2fa' | 'rate_limit' | 'login_required' | null;

export interface BlockerResult {
  blocked: boolean;
  reason: BlockerReason;
  description: string;
}

// ── Pattern matchers ──

const CAPTCHA_PATTERNS = [
  'captcha',
  'recaptcha',
  'hcaptcha',
  'turnstile',
  'verify you are human',
  'prove you are human',
  'i\'m not a robot',
  'security check',
  'challenge-platform',
  'cf-turnstile',
  'g-recaptcha',
  'h-captcha',
];

const TWO_FA_PATTERNS = [
  'verification code',
  'two-factor',
  'two factor',
  '2-step',
  '2-factor',
  'authenticator app',
  'enter the code',
  'security code',
  'sms code',
  'confirm your identity',
  'verify your identity',
  'we sent a code',
  'check your phone',
  'backup code',
];

const RATE_LIMIT_PATTERNS = [
  'too many requests',
  'rate limit',
  'try again later',
  'temporarily blocked',
  'slow down',
  'you\'re going too fast',
  'please wait',
  'request limit',
  'throttled',
];

const LOGIN_PATTERNS = [
  'sign in',
  'log in',
  'login',
  'sign up to continue',
  'create an account',
  'you need to be logged in',
  'session expired',
  'please sign in',
  'authentication required',
];

function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

/**
 * Detect blockers from page observation text content.
 *
 * Priority: CAPTCHA > 2FA > rate limit > login required
 * (higher priority blockers are checked first)
 */
export function detectBlockerFromText(observation: PageObservation): BlockerResult {
  const text = `${observation.title} ${observation.textContent}`;

  if (matchesAny(text, CAPTCHA_PATTERNS)) {
    return {
      blocked: true,
      reason: 'captcha',
      description: 'A CAPTCHA challenge was detected. Please solve it in your browser, then click Resume.',
    };
  }

  if (matchesAny(text, TWO_FA_PATTERNS)) {
    return {
      blocked: true,
      reason: '2fa',
      description: 'Two-factor authentication is required. Please complete verification in your browser, then click Resume.',
    };
  }

  if (matchesAny(text, RATE_LIMIT_PATTERNS)) {
    return {
      blocked: true,
      reason: 'rate_limit',
      description: 'The website is rate-limiting requests. Please wait a moment and click Resume.',
    };
  }

  if (matchesAny(text, LOGIN_PATTERNS)) {
    // Only flag as login required if URL suggests a login page
    const loginUrlPatterns = ['login', 'signin', 'sign-in', 'auth', 'accounts'];
    const isLoginUrl = loginUrlPatterns.some((p) => observation.url.toLowerCase().includes(p));

    if (isLoginUrl) {
      return {
        blocked: true,
        reason: 'login_required',
        description: 'You need to be logged in to this website. Please log in manually, then click Resume.',
      };
    }
  }

  return { blocked: false, reason: null, description: '' };
}

/**
 * Full blocker detection — combines text heuristics with
 * optional DOM-level checks via Stagehand.
 */
export async function detectBlocker(
  observation: PageObservation,
  stagehand?: Stagehand,
): Promise<BlockerResult> {
  // 1. Text-based heuristic detection
  const textResult = detectBlockerFromText(observation);
  if (textResult.blocked) return textResult;

  // 2. DOM-level checks via Stagehand (if available)
  if (stagehand) {
    try {
      const page = stagehand.page;

      // Check for reCAPTCHA iframe
      const hasCaptchaFrame = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.some((f) => {
          const src = f.src?.toLowerCase() ?? '';
          return (
            src.includes('recaptcha') ||
            src.includes('hcaptcha') ||
            src.includes('turnstile')
          );
        });
      });

      if (hasCaptchaFrame) {
        return {
          blocked: true,
          reason: 'captcha',
          description: 'A CAPTCHA challenge iframe was detected. Please solve it in your browser, then click Resume.',
        };
      }
    } catch {
      // DOM checks are best-effort — don't fail if they error
    }
  }

  return { blocked: false, reason: null, description: '' };
}
