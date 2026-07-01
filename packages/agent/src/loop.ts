import type { Stagehand } from '@browserbasehq/stagehand';
import type { AgentAction, StepEvent, TaskStatus } from '@dart/shared';
import { observePage } from './observer';
import { planNextAction, type PlannerResult } from './planner';
import { executeAction } from './actions';
import { detectBlocker } from './blocker-detector';
import { actionDelay } from './pacing';

// ── Constants ──
const MAX_STEPS = 25;

// ── Types ──

export interface AgentLoopCallbacks {
  onStep: (step: StepEvent) => void;
  onBlocked: (step: StepEvent, reason: string) => void;
  onAskUser: (step: StepEvent, question: string) => void;
}

export interface PlannerConfig {
  apiBaseUrl: string;
  userId: string;
  plan: 'free' | 'pro' | 'power';
  authToken?: string;
}

export interface AgentLoopParams {
  command: string;
  taskId: string;
  stagehand: Stagehand;
  signal: AbortSignal;
  callbacks: AgentLoopCallbacks;
  /** Planner config — if omitted, uses fallback (Phase 2 compat) */
  plannerConfig?: PlannerConfig;
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
 * Main agent loop — observe → detect blockers → plan → act → emit → delay → repeat
 *
 * Phase 3 enhancements over Phase 2:
 * - Real AI planning via /api/agent/run
 * - Blocker detection (CAPTCHA, 2FA, rate limit, login)
 * - Rate limit awareness from API headers
 * - Page text extraction for AI context
 */
export async function runAgentLoop(params: AgentLoopParams): Promise<AgentLoopResult> {
  const { command, taskId, stagehand, signal, callbacks, plannerConfig } = params;
  const actionHistory: AgentAction[] = [];
  let stepCount = 0;

  // Emit a "thinking" step at the start
  const thinkingStep: StepEvent = {
    id: crypto.randomUUID(),
    taskId,
    type: 'thinking',
    description: `Processing: "${command}"`,
    status: 'running',
    timestamp: Date.now(),
  };
  callbacks.onStep(thinkingStep);

  while (stepCount < MAX_STEPS) {
    // ── Check cancellation ──
    if (signal.aborted) {
      return { status: 'cancelled', summary: 'Task was cancelled by user', stepCount };
    }

    // ── 1. Observe the page ──
    const observation = await observePage(stagehand);

    // ── 2. Detect blockers ──
    const blocker = await detectBlocker(observation, stagehand);
    if (blocker.blocked && blocker.reason) {
      const blockedStep: StepEvent = {
        id: crypto.randomUUID(),
        taskId,
        type: 'blocked',
        description: blocker.description,
        status: 'failed',
        timestamp: Date.now(),
      };
      callbacks.onBlocked(blockedStep, blocker.description);
      return { status: 'paused', summary: `Blocked: ${blocker.description}`, stepCount };
    }

    // ── 3. Plan the next action (AI or fallback) ──
    let planResult: PlannerResult;
    try {
      planResult = await planNextAction(
        { command, observation, actionHistory, stepCount },
        plannerConfig,
      );
    } catch (planError) {
      const errorMsg = planError instanceof Error ? planError.message : String(planError);
      return { status: 'failed', summary: `Planning failed: ${errorMsg}`, stepCount };
    }

    const { action } = planResult;

    // Mark the thinking step as done
    if (stepCount === 0) {
      thinkingStep.status = 'success';
      callbacks.onStep({ ...thinkingStep });
    }

    // ── 4. Emit the step as "running" ──
    const step = createStep(taskId, action, 'running');
    callbacks.onStep(step);

    // Check cancellation before executing
    if (signal.aborted) {
      return { status: 'cancelled', summary: 'Task was cancelled by user', stepCount };
    }

    // ── 5. Handle special action types ──
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

    // ── 6. Execute the action ──
    const startTime = Date.now();
    const result = await executeAction(action, stagehand);
    const duration = Date.now() - startTime;

    // ── 7. Update step with result ──
    step.duration = duration;
    if (result.success) {
      step.status = 'success';
      step.detail = result.detail;
    } else {
      step.status = 'failed';
      step.detail = result.error;
    }
    callbacks.onStep({ ...step });

    // ── 8. Record action in history ──
    actionHistory.push(action);
    stepCount++;

    // ── 9. Check termination ──
    if (action.type === 'done') {
      return { status: 'completed', summary: action.result, stepCount };
    }

    if (!result.success) {
      return { status: 'failed', summary: result.error ?? 'Action execution failed', stepCount };
    }

    // ── 10. Human-like delay ──
    await actionDelay();
  }

  return {
    status: 'completed',
    summary: `Reached maximum step limit (${MAX_STEPS})`,
    stepCount,
  };
}
