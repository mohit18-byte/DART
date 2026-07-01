import type { Stagehand } from '@browserbasehq/stagehand';
import type { AgentAction, StepEvent, TaskStatus } from '@dart/shared';
import { observePage } from './observer';
import { planNextAction } from './planner';
import { executeAction } from './actions';
import { actionDelay } from './pacing';

// ── Constants ──
const MAX_STEPS = 25;

// ── Types ──

export interface AgentLoopCallbacks {
  onStep: (step: StepEvent) => void;
  onBlocked: (step: StepEvent, reason: string) => void;
  onAskUser: (step: StepEvent, question: string) => void;
}

export interface AgentLoopParams {
  command: string;
  taskId: string;
  stagehand: Stagehand;
  signal: AbortSignal;
  callbacks: AgentLoopCallbacks;
}

export interface AgentLoopResult {
  status: TaskStatus;
  summary: string;
  stepCount: number;
}

// ── Helper: Create a StepEvent ──

function createStep(
  taskId: string,
  action: AgentAction,
  status: StepEvent['status'] = 'running',
): StepEvent {
  return {
    id: crypto.randomUUID(),
    taskId,
    type: action.type,
    description: getActionDescription(action),
    status,
    timestamp: Date.now(),
  };
}

function getActionDescription(action: AgentAction): string {
  switch (action.type) {
    case 'navigate':
      return action.description;
    case 'click':
      return action.description;
    case 'type':
      return action.description;
    case 'scroll':
      return action.description;
    case 'extract':
      return action.description;
    case 'done':
      return action.result;
    case 'ask_user':
      return `Question: ${action.question}`;
    case 'blocked':
      return action.description;
  }
}

/**
 * Main agent loop.
 *
 * Flow: observe() → plan() → act() → emit step → humanDelay() → repeat
 *
 * Termination conditions:
 * - Action type is 'done' → success
 * - Action type is 'blocked' → paused, waiting for user
 * - Action type is 'ask_user' → paused, waiting for user response
 * - Step count >= MAX_STEPS → forced stop
 * - AbortSignal is triggered → cancelled
 * - Unrecoverable error → failed
 */
export async function runAgentLoop(params: AgentLoopParams): Promise<AgentLoopResult> {
  const { command, taskId, stagehand, signal, callbacks } = params;
  const actionHistory: AgentAction[] = [];
  let stepCount = 0;

  // Emit a "thinking" step at the start
  const thinkingStep = createStep(taskId, { type: 'done', result: `Processing: "${command}"` }, 'running');
  thinkingStep.type = 'thinking';
  thinkingStep.description = `Processing: "${command}"`;
  callbacks.onStep(thinkingStep);

  while (stepCount < MAX_STEPS) {
    // Check cancellation
    if (signal.aborted) {
      return { status: 'cancelled', summary: 'Task was cancelled by user', stepCount };
    }

    // 1. Observe the page
    const observation = await observePage(stagehand);

    // 2. Plan the next action (stubbed in Phase 2)
    const action = await planNextAction({
      command,
      observation,
      actionHistory,
      stepCount,
    });

    // 3. Emit the step as "running"
    const step = createStep(taskId, action, 'running');
    callbacks.onStep(step);

    // Check cancellation before executing
    if (signal.aborted) {
      return { status: 'cancelled', summary: 'Task was cancelled by user', stepCount };
    }

    // 4. Handle special action types before execution
    if (action.type === 'blocked') {
      step.status = 'failed';
      callbacks.onBlocked(step, action.description);
      return { status: 'paused', summary: `Blocked: ${action.description}`, stepCount };
    }

    if (action.type === 'ask_user') {
      step.status = 'pending';
      callbacks.onAskUser(step, action.question);
      return { status: 'paused', summary: `Waiting for user: ${action.question}`, stepCount };
    }

    // 5. Execute the action
    const startTime = Date.now();
    const result = await executeAction(action, stagehand);
    const duration = Date.now() - startTime;

    // 6. Update step with result
    step.duration = duration;
    if (result.success) {
      step.status = 'success';
      step.detail = result.detail;
    } else {
      step.status = 'failed';
      step.detail = result.error;
    }

    // Emit updated step
    callbacks.onStep({ ...step });

    // 7. Record action in history
    actionHistory.push(action);
    stepCount++;

    // 8. Check if we're done
    if (action.type === 'done') {
      return {
        status: 'completed',
        summary: action.result,
        stepCount,
      };
    }

    // 9. If action failed, stop
    if (!result.success) {
      return {
        status: 'failed',
        summary: result.error ?? 'Action execution failed',
        stepCount,
      };
    }

    // 10. Human-like delay before next iteration
    await actionDelay();
  }

  // Max steps reached
  return {
    status: 'completed',
    summary: `Reached maximum step limit (${MAX_STEPS})`,
    stepCount,
  };
}
