import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { tasks, steps, users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const StepSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  description: z.string(),
  status: z.string(),
  detail: z.string().optional(),
  duration: z.number().optional(),
});

const RequestSchema = z.object({
  taskId: z.string().uuid(),
  command: z.string().min(1),
  status: z.string(),
  stepCount: z.number().int().min(0),
  result: z.string().optional(),
  modelUsed: z.string().optional(),
  steps: z.array(StepSchema).default([]),
});

/**
 * POST /api/task/save
 *
 * Saves a completed task + its steps to Supabase.
 * Called by the extension service worker after task completion.
 *
 * SECURITY: userId comes from the verified Clerk JWT, not the request body.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Ensure user exists (upsert)
    await db
      .insert(users)
      .values({ id: userId, email: 'unknown@dart.app', plan: 'free' })
      .onConflictDoNothing();

    // Insert task
    const [savedTask] = await db
      .insert(tasks)
      .values({
        id: data.taskId,
        userId,
        command: data.command,
        status: data.status,
        stepCount: data.stepCount,
        result: data.result ?? null,
        modelUsed: data.modelUsed ?? null,
        completedAt: new Date(),
      })
      .returning({ id: tasks.id });

    // Insert steps
    if (data.steps.length > 0) {
      await db.insert(steps).values(
        data.steps.map((step) => ({
          id: step.id,
          taskId: data.taskId,
          type: step.type,
          description: step.description,
          status: step.status,
          detail: step.detail ?? null,
          duration: step.duration ?? null,
        })),
      );
    }

    return NextResponse.json({ taskId: savedTask!.id, saved: true });
  } catch (err) {
    console.error('[/api/task/save] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
