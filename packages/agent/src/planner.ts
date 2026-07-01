import { AgentActionSchema, type AgentAction } from '@dart/shared';
import type { PageObservation } from './observer';
import { formatObservation } from './observer';

/**
 * Planner — calls the Next.js /api/agent/run proxy to get
 * Claude's next action based on page state.
 *
 * Phase 3: Full AI integration with retry logic.
 * Falls back to basic pattern matching if the API is unreachable.
 */

interface PlannerInput {
  command: string;
  observation: PageObservation;
  actionHistory: AgentAction[];
  stepCount: number;
}

interface PlannerConfig {
  /** Base URL for the Next.js API (e.g. http://localhost:3000) */
  apiBaseUrl: string;
  /** User ID for rate limiting (placeholder in Phase 3, Clerk ID in Phase 5) */
  userId: string;
  /** User's plan tier */
  plan: 'free' | 'pro' | 'power';
  /** Auth token (placeholder in Phase 3, Clerk JWT in Phase 5) */
  authToken?: string;
}

export interface PlannerResult {
  action: AgentAction;
  rateLimit?: {
    remaining: number;
    reset: number;
    limit: number;
  };
}

/**
 * Extract a URL from a natural language command (fallback parser).
 */
function extractUrl(command: string): string | null {
  const urlMatch = command.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) return urlMatch[0];

  const goToMatch = command.match(
    /(?:go\s+to|navigate\s+to|open|visit)\s+([a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}(?:\/\S*)?)/i,
  );
  if (goToMatch?.[1]) {
    const domain = goToMatch[1];
    return domain.startsWith('http') ? domain : `https://${domain}`;
  }

  return null;
}

/**
 * Fallback planner — used when the API is unreachable.
 * Only handles simple navigation commands.
 */
function fallbackPlan(input: PlannerInput): AgentAction {
  const { command, observation, actionHistory, stepCount } = input;

  if (stepCount >= 25) {
    return { type: 'done', result: `Max steps reached. Last page: ${observation.url}` };
  }

  const lastAction = actionHistory[actionHistory.length - 1];
  if (lastAction?.type === 'navigate' || lastAction?.type === 'done') {
    return { type: 'done', result: `Completed. Page: ${observation.title} (${observation.url})` };
  }

  const url = extractUrl(command);
  if (url) {
    return { type: 'navigate', url, description: `Navigating to ${url}` };
  }

  return {
    type: 'done',
    result: `Cannot reach the AI planning service. Please ensure the web server is running.`,
  };
}

/**
 * Plan the next action by calling the AI planning API.
 *
 * Flow:
 * 1. POST to /api/agent/run with command, page state, action history
 * 2. Receive a Zod-validated AgentAction
 * 3. On failure: retry once, then fall back to basic pattern matching
 */
export async function planNextAction(
  input: PlannerInput,
  config?: PlannerConfig,
): Promise<PlannerResult> {
  // If no config provided, use fallback (Phase 2 compatibility)
  if (!config) {
    return { action: fallbackPlan(input) };
  }

  const { command, observation, actionHistory, stepCount } = input;

  // Safety: max steps
  if (stepCount >= 25) {
    return {
      action: {
        type: 'done',
        result: `Reached maximum step limit (25). Last page: ${observation.url}`,
      },
    };
  }

  const pageState = formatObservation(observation);

  const requestBody = {
    command,
    pageState,
    actionHistory,
    plan: config.plan,
    userId: config.userId,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  // Attempt 1
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/agent/run`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    // Handle rate limiting
    if (response.status === 429) {
      const body = (await response.json()) as Record<string, unknown>;
      return {
        action: {
          type: 'done',
          result: String(body.message ?? 'Rate limit exceeded. Please try again later.'),
        },
        rateLimit: {
          remaining: 0,
          reset: Number(response.headers.get('X-RateLimit-Reset') ?? 0),
          limit: Number(response.headers.get('X-RateLimit-Limit') ?? 0),
        },
      };
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    const action = AgentActionSchema.parse(body.action);

    return {
      action,
      rateLimit: {
        remaining: Number(response.headers.get('X-RateLimit-Remaining') ?? -1),
        reset: Number(response.headers.get('X-RateLimit-Reset') ?? 0),
        limit: Number(response.headers.get('X-RateLimit-Limit') ?? 0),
      },
    };
  } catch (firstError) {
    // Attempt 2 — single retry
    try {
      const retryResponse = await fetch(`${config.apiBaseUrl}/api/agent/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      if (!retryResponse.ok) {
        throw new Error(`Retry failed: ${retryResponse.status}`);
      }

      const body = (await retryResponse.json()) as Record<string, unknown>;
      const action = AgentActionSchema.parse(body.action);

      return {
        action,
        rateLimit: {
          remaining: Number(retryResponse.headers.get('X-RateLimit-Remaining') ?? -1),
          reset: Number(retryResponse.headers.get('X-RateLimit-Reset') ?? 0),
          limit: Number(retryResponse.headers.get('X-RateLimit-Limit') ?? 0),
        },
      };
    } catch {
      // Both attempts failed — fall back to local pattern matching
      console.error('[Planner] Both API attempts failed:', firstError);
      return { action: fallbackPlan(input) };
    }
  }
}
