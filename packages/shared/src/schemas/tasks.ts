import { z } from 'zod';
import { StepEventSchema } from './steps';

// ── Task Status ──

export const TaskStatusSchema = z.enum([
  'pending',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// ── Task ──

export const TaskSchema = z.object({
  id: z.string().uuid(),
  command: z.string().min(1),
  status: TaskStatusSchema,
  steps: z.array(StepEventSchema),
  createdAt: z.number().describe('Unix timestamp in ms'),
  completedAt: z.number().optional().describe('Unix timestamp in ms'),
  result: z.string().optional().describe('Final result summary'),
  stepCount: z.number().default(0),
});

export type Task = z.infer<typeof TaskSchema>;
