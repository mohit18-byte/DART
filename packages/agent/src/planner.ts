import type { AgentAction } from '@dart/shared';
import type { PageObservation } from './observer';

/**
 * Planner — decides the next action based on the command and page state.
 *
 * Phase 2: STUBBED with hardcoded action sequences.
 * Phase 3: Calls Claude via the Next.js /api/agent/run endpoint.
 */

interface PlannerInput {
  command: string;
  observation: PageObservation;
  actionHistory: AgentAction[];
  stepCount: number;
}

/**
 * Extract a URL from a natural language command.
 * Handles patterns like "go to google.com", "navigate to https://twitter.com"
 */
function extractUrl(command: string): string | null {
  // Match explicit URLs
  const urlMatch = command.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) return urlMatch[0];

  // Match "go to <domain>" patterns
  const goToMatch = command.match(/(?:go\s+to|navigate\s+to|open|visit)\s+([a-zA-Z0-9][\w.-]*\.[a-zA-Z]{2,}(?:\/\S*)?)/i);
  if (goToMatch?.[1]) {
    const domain = goToMatch[1];
    return domain.startsWith('http') ? domain : `https://${domain}`;
  }

  return null;
}

/**
 * Plan the next action.
 *
 * Phase 2 hardcoded logic:
 * - "go to X" → navigate to X → done
 * - Any other command → done with message
 * - If already navigated → done
 */
export async function planNextAction(input: PlannerInput): Promise<AgentAction> {
  const { command, observation, actionHistory, stepCount } = input;
  const lowerCommand = command.toLowerCase();

  // Safety: max steps
  if (stepCount >= 25) {
    return {
      type: 'done',
      result: `Reached maximum step limit (25). Last page: ${observation.url}`,
    };
  }

  // If we already have actions, check if we should stop
  const lastAction = actionHistory[actionHistory.length - 1];
  if (lastAction?.type === 'navigate' || lastAction?.type === 'done') {
    // Already navigated — we're done
    return {
      type: 'done',
      result: `Completed. Current page: ${observation.title} (${observation.url})`,
    };
  }

  // Try to extract a URL from the command
  const url = extractUrl(command);
  if (url) {
    return {
      type: 'navigate',
      url,
      description: `Navigating to ${url}`,
    };
  }

  // Search commands — navigate to Google with search query
  if (lowerCommand.includes('search for') || lowerCommand.includes('google')) {
    const searchMatch = command.match(/(?:search\s+(?:for|about)?|google)\s+(.+)/i);
    const query = searchMatch?.[1] ?? command;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return {
      type: 'navigate',
      url: searchUrl,
      description: `Searching Google for "${query}"`,
    };
  }

  // Default: can't handle in Phase 2
  return {
    type: 'done',
    result: `[Phase 2 stub] Cannot execute complex command yet: "${command}". Claude integration coming in Phase 3.`,
  };
}
