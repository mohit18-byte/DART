import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { Plan, AgentAction } from '@dart/shared';

/**
 * AI model configuration for the agent planner.
 *
 * Model selection per plan:
 *   free  → Gemini 2.0 Flash (fast, free API)
 *   pro   → Claude Sonnet 4 (best quality/speed balance)
 *   power → Claude Sonnet 4 (same model, higher limits)
 */

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODELS: Record<Plan, () => LanguageModel> = {
  free: () => google('gemini-2.0-flash'),
  pro: () => anthropic('claude-sonnet-4-20250514'),
  power: () => anthropic('claude-sonnet-4-20250514'),
};

/**
 * Get the AI model for the user's plan tier.
 */
export function getModelForPlan(plan: Plan): LanguageModel {
  const factory = MODELS[plan];
  if (!factory) {
    return MODELS.free();
  }
  return factory();
}

/**
 * System prompt for the agent planner.
 *
 * Provides context about:
 * - The agent's goal
 * - Current page state
 * - Action history
 * - Available actions
 * - Safety rules
 */
export function buildSystemPrompt(): string {
  return `You are Dart, an AI browser agent that helps users accomplish tasks on the web.

## Your Role
You observe the current state of a web page and decide the next single action to take.
You operate step by step — one action at a time.

## Available Actions
You must return ONE of these action types:

1. **navigate** — Go to a URL
   { "type": "navigate", "url": "https://...", "description": "Why navigating here" }

2. **click** — Click an element
   { "type": "click", "selector": "Human description of element", "description": "What this click does" }

3. **type** — Type text into a field
   { "type": "type", "selector": "Description of input field", "text": "Text to type", "description": "Purpose of typing" }

4. **scroll** — Scroll the page
   { "type": "scroll", "direction": "up|down|left|right", "amount": "small|medium|large|page", "description": "Why scrolling" }

5. **extract** — Extract data from the page
   { "type": "extract", "instruction": "What to extract", "description": "Purpose of extraction" }

6. **done** — Task is complete
   { "type": "done", "result": "Summary of what was accomplished" }

7. **ask_user** — Need user input to proceed
   { "type": "ask_user", "question": "What to ask", "reason": "Why you need input" }

8. **blocked** — Cannot proceed (CAPTCHA, 2FA, login wall)
   { "type": "blocked", "reason": "captcha|2fa|rate_limit|login_required|unknown", "description": "What's blocking" }

## Safety Rules
- NEVER enter credentials (passwords, credit card numbers, SSNs, etc.)
- If asked to do something illegal, harmful, or unethical, return a "done" action with an explanation of why you refused
- If a login is required and the user is not logged in, return "blocked" with reason "login_required"
- If you encounter a CAPTCHA, return "blocked" with reason "captcha"
- If you encounter 2FA, return "blocked" with reason "2fa"
- NEVER make purchases or financial transactions unless the user explicitly confirms the exact amount
- NEVER modify security settings (passwords, 2FA, recovery options)

## Response Format
Return ONLY a valid JSON object matching one of the action types above. No explanation, no markdown, no code blocks — just the JSON object.`;
}

/**
 * Build the user prompt with current context.
 *
 * Token budget: pageState trimmed to 5KB max,
 * action history summarized when > 20 entries.
 */
export function buildUserPrompt(
  command: string,
  pageState: string,
  actionHistory: AgentAction[],
): string {
  // Trim page state to 5KB
  const trimmedState = pageState.length > 5000
    ? pageState.slice(0, 5000) + '\n\n[...page state truncated to 5KB]'
    : pageState;

  // Summarize action history if too long
  let historyText: string;
  if (actionHistory.length > 20) {
    const recent = actionHistory.slice(-10);
    const older = actionHistory.slice(0, -10);
    const olderSummary = older.map((a) => `${a.type}`).join(', ');
    historyText = `Previous actions (${older.length} earlier): ${olderSummary}\n\nRecent actions:\n${recent.map((a, i) => `${i + 1}. ${JSON.stringify(a)}`).join('\n')}`;
  } else if (actionHistory.length > 0) {
    historyText = actionHistory.map((a, i) => `${i + 1}. ${JSON.stringify(a)}`).join('\n');
  } else {
    historyText = 'None — this is the first action.';
  }

  return `## User's Command
"${command}"

## Current Page State
${trimmedState}

## Action History
${historyText}

## Your Task
Based on the page state and action history, decide the NEXT SINGLE action to take toward completing the user's command. Return only the JSON action object.`;
}
