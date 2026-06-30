// ── Pricing Plans ──

export type Plan = 'free' | 'pro' | 'power';

export interface PlanLimits {
  dailyTasks: number;
  model: string;
  maxStepsPerTask: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    dailyTasks: 5,
    model: 'gemini-2.0-flash',
    maxStepsPerTask: 15,
  },
  pro: {
    dailyTasks: 30,
    model: 'claude-sonnet-4-20250514',
    maxStepsPerTask: 25,
  },
  power: {
    dailyTasks: 100,
    model: 'claude-sonnet-4-20250514',
    maxStepsPerTask: 50,
  },
};
