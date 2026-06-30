// ── Schemas ──
export {
  AgentActionSchema,
  clickAction,
  typeAction,
  scrollAction,
  navigateAction,
  extractAction,
  doneAction,
  askUserAction,
  blockedAction,
} from './schemas/actions';

export { StepEventSchema, StepStatusSchema } from './schemas/steps';

export { TaskSchema, TaskStatusSchema } from './schemas/tasks';

export {
  ExtensionMessageSchema,
  BackgroundMessageSchema,
  NativeOutgoingSchema,
  NativeIncomingSchema,
  taskStartMessage,
  taskCancelMessage,
  taskPauseMessage,
  taskResumeMessage,
  userResponseMessage,
  stepUpdateMessage,
  stepBlockedMessage,
  stepAskUserMessage,
  statusReadyMessage,
  statusErrorMessage,
  statusConnectedMessage,
  taskStatusUpdateMessage,
} from './schemas/messages';

// ── Types ──
export type {
  AgentAction,
  ActionType,
  StepEvent,
  StepStatus,
  Task,
  TaskStatus,
  ExtensionMessage,
  BackgroundMessage,
  NativeOutgoing,
  NativeIncoming,
  Plan,
  PlanLimits,
} from './types';

export { PLAN_LIMITS } from './types';
