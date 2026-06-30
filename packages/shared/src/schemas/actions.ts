import { z } from 'zod';

// ── Agent Action Discriminated Union ──

export const clickAction = z.object({
  type: z.literal('click'),
  selector: z.string().describe('Human-readable description of the element to click'),
  description: z.string().describe('What this click accomplishes'),
});

export const typeAction = z.object({
  type: z.literal('type'),
  selector: z.string().describe('Human-readable description of the input field'),
  text: z.string().describe('Text to type into the field'),
  description: z.string().describe('What this typing accomplishes'),
});

export const scrollAction = z.object({
  type: z.literal('scroll'),
  direction: z.enum(['up', 'down', 'left', 'right']),
  amount: z.enum(['small', 'medium', 'large', 'page']).default('medium'),
  description: z.string().describe('Why we are scrolling'),
});

export const navigateAction = z.object({
  type: z.literal('navigate'),
  url: z.string().url().describe('The URL to navigate to'),
  description: z.string().describe('Why we are navigating here'),
});

export const extractAction = z.object({
  type: z.literal('extract'),
  instruction: z.string().describe('What data to extract from the page'),
  schema: z.record(z.string(), z.string()).optional().describe('Expected shape of extracted data'),
  description: z.string().describe('What this extraction is for'),
});

export const doneAction = z.object({
  type: z.literal('done'),
  result: z.string().describe('Summary of what was accomplished'),
});

export const askUserAction = z.object({
  type: z.literal('ask_user'),
  question: z.string().describe('The question to ask the user'),
  reason: z.string().describe('Why the agent needs user input'),
});

export const blockedAction = z.object({
  type: z.literal('blocked'),
  reason: z.enum(['captcha', '2fa', 'rate_limit', 'login_required', 'unknown']),
  description: z.string().describe('Details about the blocker'),
});

export const AgentActionSchema = z.discriminatedUnion('type', [
  clickAction,
  typeAction,
  scrollAction,
  navigateAction,
  extractAction,
  doneAction,
  askUserAction,
  blockedAction,
]);

export type AgentAction = z.infer<typeof AgentActionSchema>;
export type ActionType = AgentAction['type'];
