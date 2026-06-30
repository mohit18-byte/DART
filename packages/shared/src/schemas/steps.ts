import { z } from 'zod';

// ── Step Status ──

export const StepStatusSchema = z.enum(['pending', 'running', 'success', 'failed']);
export type StepStatus = z.infer<typeof StepStatusSchema>;

// ── Step Event ──

export const StepEventSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  type: z.enum([
    'click',
    'type',
    'scroll',
    'navigate',
    'extract',
    'done',
    'ask_user',
    'blocked',
    'thinking',
    'error',
  ]),
  description: z.string(),
  status: StepStatusSchema,
  timestamp: z.number().describe('Unix timestamp in ms'),
  detail: z.string().optional().describe('Additional detail or error message'),
  duration: z.number().optional().describe('Duration in ms'),
});

export type StepEvent = z.infer<typeof StepEventSchema>;
