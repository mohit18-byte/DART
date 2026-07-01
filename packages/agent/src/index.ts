// @dart/agent — Agent loop and browser automation

export { runAgentLoop } from './loop';
export type { AgentLoopParams, AgentLoopResult, AgentLoopCallbacks } from './loop';
export { executeAction } from './actions';
export type { ActionResult } from './actions';
export { observePage } from './observer';
export type { PageObservation } from './observer';
export { planNextAction } from './planner';
export { actionDelay, keystrokeDelay, pageLoadWait, shortDelay } from './pacing';

export const AGENT_VERSION = '0.1.0';
export const MAX_STEPS = 25;
