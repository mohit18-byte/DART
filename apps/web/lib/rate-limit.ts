import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Plan } from '@dart/shared';

/**
 * Upstash rate limiter — sliding window per plan tier.
 *
 * Keys: dart:ratelimit:{userId}
 *
 * Limits:
 *   free  → 5 tasks / 24h
 *   pro   → 30 tasks / 24h
 *   power → 100 tasks / 24h
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const FREE_LIMITER = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '24h'),
  prefix: 'dart:ratelimit:free',
  analytics: true,
});

const PRO_LIMITER = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '24h'),
  prefix: 'dart:ratelimit:pro',
  analytics: true,
});

const POWER_LIMITER = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '24h'),
  prefix: 'dart:ratelimit:power',
  analytics: true,
});

const LIMITERS: Record<Plan, Ratelimit> = {
  free: FREE_LIMITER,
  pro: PRO_LIMITER,
  power: POWER_LIMITER,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Check rate limit for a user on their plan tier.
 *
 * @param userId - Clerk user ID (sub from JWT)
 * @param plan - User's subscription plan
 * @returns Whether the request is allowed + metadata for headers
 */
export async function checkRateLimit(
  userId: string,
  plan: Plan,
): Promise<RateLimitResult> {
  const limiter = LIMITERS[plan] ?? FREE_LIMITER;
  const { success, remaining, reset, limit } = await limiter.limit(userId);

  return {
    allowed: success,
    remaining,
    reset,
    limit,
  };
}

/**
 * Set a task cancellation flag in Upstash.
 * The agent loop checks this periodically.
 */
export async function setCancelFlag(taskId: string): Promise<void> {
  await redis.set(`dart:cancel:${taskId}`, '1', { ex: 3600 }); // TTL 1 hour
}

/**
 * Check if a task has been cancelled.
 */
export async function isCancelled(taskId: string): Promise<boolean> {
  const val = await redis.get(`dart:cancel:${taskId}`);
  return val === '1';
}

/**
 * Clear a cancellation flag.
 */
export async function clearCancelFlag(taskId: string): Promise<void> {
  await redis.del(`dart:cancel:${taskId}`);
}
