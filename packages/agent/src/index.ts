// @dart/agent — Agent loop and browser automation

export { runAgentLoop } from './loop';
export type { AgentLoopParams, AgentLoopResult, AgentLoopCallbacks, PlannerConfig } from './loop';
export { executeAction } from './actions';
export type { ActionResult } from './actions';
export { observePage, formatObservation } from './observer';
export type { PageObservation } from './observer';
export { planNextAction } from './planner';
export type { PlannerResult } from './planner';
export { detectBlocker, detectBlockerFromText } from './blocker-detector';
export type { BlockerResult, BlockerReason } from './blocker-detector';
export { actionDelay, keystrokeDelay, pageLoadWait, shortDelay } from './pacing';

export const AGENT_VERSION = '0.1.0';
export const MAX_STEPS = 25;
