import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { AgentActionSchema, type AgentAction, type Plan } from '@dart/shared';
import { getModelForPlan, buildSystemPrompt, buildUserPrompt } from '@/lib/ai';
import { checkRateLimit } from '@/lib/rate-limit';

// ── Request Schema ──

const RequestSchema = z.object({
  command: z.string().min(1),
  pageState: z.string(),
  actionHistory: z.array(z.any()).default([]),
  plan: z.enum(['free', 'pro', 'power']).default('free'),
  userId: z.string().min(1),
});

// ── POST /api/agent/run ──

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { command, pageState, actionHistory, plan, userId } = parsed.data;

    // 2. Check rate limit
    // Phase 3: userId comes from request body (placeholder auth)
    // Phase 5: Extract from Clerk JWT
    const rateLimit = await checkRateLimit(userId, plan as Plan);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You've used all your daily tasks. ${plan === 'free' ? 'Upgrade to Pro for 30 tasks/day.' : 'Try again tomorrow.'}`,
          remaining: 0,
          reset: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.reset),
            'X-RateLimit-Limit': String(rateLimit.limit),
          },
        },
      );
    }

    // 3. Select model based on plan
    const model = getModelForPlan(plan as Plan);

    // 4. Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(command, pageState, actionHistory as AgentAction[]);

    // 5. Call AI model with generateObject()
    let action: AgentAction;
    try {
      const result = await generateObject({
        model,
        schema: AgentActionSchema,
        system: systemPrompt,
        prompt: userPrompt,
        // Use 'json' mode for Gemini (more reliable), default for Claude
        ...(plan === 'free' ? { mode: 'json' as const } : {}),
        maxRetries: 1,
      });

      action = result.object as AgentAction;
    } catch (firstError) {
      // Retry once with correction prompt
      console.warn('[/api/agent/run] First attempt failed, retrying:', firstError);

      try {
        const retryPrompt = `${userPrompt}\n\nIMPORTANT: Your previous response was invalid. Please return a valid JSON object matching one of the action types (navigate, click, type, scroll, extract, done, ask_user, blocked). Return ONLY the JSON object, nothing else.`;

        const retryResult = await generateObject({
          model,
          schema: AgentActionSchema,
          system: systemPrompt,
          prompt: retryPrompt,
          ...(plan === 'free' ? { mode: 'json' as const } : {}),
          maxRetries: 0,
        });

        action = retryResult.object as AgentAction;
      } catch (retryError) {
        console.error('[/api/agent/run] Retry failed:', retryError);
        return NextResponse.json(
          {
            error: 'AI model failed to return a valid action',
            details: retryError instanceof Error ? retryError.message : String(retryError),
          },
          { status: 502 },
        );
      }
    }

    // 6. Return the action with rate limit headers
    return NextResponse.json(
      { action },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
          'X-RateLimit-Limit': String(rateLimit.limit),
        },
      },
    );
  } catch (err) {
    console.error('[/api/agent/run] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
