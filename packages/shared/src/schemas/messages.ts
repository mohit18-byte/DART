import { z } from 'zod';
import { StepEventSchema } from './steps';
import { AgentActionSchema } from './actions';
import { TaskStatusSchema } from './tasks';

// ── Extension → Service Worker Messages ──

export const taskStartMessage = z.object({
  type: z.literal('task:start'),
  command: z.string().min(1),
  tabId: z.number().optional(),
});

export const taskCancelMessage = z.object({
  type: z.literal('task:cancel'),
  taskId: z.string().uuid(),
});

export const taskPauseMessage = z.object({
  type: z.literal('task:pause'),
  taskId: z.string().uuid(),
});

export const taskResumeMessage = z.object({
  type: z.literal('task:resume'),
  taskId: z.string().uuid(),
});

export const userResponseMessage = z.object({
  type: z.literal('user:response'),
  taskId: z.string().uuid(),
  response: z.string(),
});

// ── Service Worker → Extension Messages (from native binary) ──

export const stepUpdateMessage = z.object({
  type: z.literal('step:update'),
  step: StepEventSchema,
});

export const stepBlockedMessage = z.object({
  type: z.literal('step:blocked'),
  step: StepEventSchema,
  reason: z.string(),
});

export const stepAskUserMessage = z.object({
  type: z.literal('step:ask_user'),
  step: StepEventSchema,
  question: z.string(),
});

export const statusReadyMessage = z.object({
  type: z.literal('status:ready'),
  version: z.string().optional(),
});

export const statusErrorMessage = z.object({
  type: z.literal('status:error'),
  error: z.string(),
  code: z.string().optional(),
});

export const statusConnectedMessage = z.object({
  type: z.literal('status:connected'),
  port: z.number(),
});

export const taskStatusUpdateMessage = z.object({
  type: z.literal('task:status'),
  taskId: z.string().uuid(),
  status: TaskStatusSchema,
  result: z.string().optional(),
});

// ── Discriminated Unions ──

export const ExtensionMessageSchema = z.discriminatedUnion('type', [
  taskStartMessage,
  taskCancelMessage,
  taskPauseMessage,
  taskResumeMessage,
  userResponseMessage,
]);

export const BackgroundMessageSchema = z.discriminatedUnion('type', [
  stepUpdateMessage,
  stepBlockedMessage,
  stepAskUserMessage,
  statusReadyMessage,
  statusErrorMessage,
  statusConnectedMessage,
  taskStatusUpdateMessage,
]);

export type ExtensionMessage = z.infer<typeof ExtensionMessageSchema>;
export type BackgroundMessage = z.infer<typeof BackgroundMessageSchema>;

// ── Native Messaging (Extension ↔ Native Binary) ──

export const NativeOutgoingSchema = z.discriminatedUnion('type', [
  taskStartMessage,
  taskCancelMessage,
  taskPauseMessage,
  taskResumeMessage,
  userResponseMessage,
]);

export const NativeIncomingSchema = z.discriminatedUnion('type', [
  stepUpdateMessage,
  stepBlockedMessage,
  stepAskUserMessage,
  statusReadyMessage,
  statusErrorMessage,
  statusConnectedMessage,
  taskStatusUpdateMessage,
]);

export type NativeOutgoing = z.infer<typeof NativeOutgoingSchema>;
export type NativeIncoming = z.infer<typeof NativeIncomingSchema>;
