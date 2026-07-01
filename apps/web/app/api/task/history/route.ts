import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tasks } from '@/drizzle/schema';
import { eq, desc, lt, and } from 'drizzle-orm';

/**
 * GET /api/task/history
 *
 * Returns the user's task history, newest first.
 * Cursor-based pagination via `?cursor=<taskId>&limit=20`.
 *
 * SECURITY: userId from verified Clerk JWT. Queries always filtered by userId.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 50);

    // Build query — always scoped to userId
    let query = db
      .select({
        id: tasks.id,
        command: tasks.command,
        status: tasks.status,
        stepCount: tasks.stepCount,
        result: tasks.result,
        modelUsed: tasks.modelUsed,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt))
      .limit(limit + 1); // Fetch one extra to detect if there's a next page

    // Cursor-based pagination
    if (cursor) {
      // Get the cursor task's createdAt
      const [cursorTask] = await db
        .select({ createdAt: tasks.createdAt })
        .from(tasks)
        .where(eq(tasks.id, cursor))
        .limit(1);

      if (cursorTask) {
        query = db
          .select({
            id: tasks.id,
            command: tasks.command,
            status: tasks.status,
            stepCount: tasks.stepCount,
            result: tasks.result,
            modelUsed: tasks.modelUsed,
            createdAt: tasks.createdAt,
            completedAt: tasks.completedAt,
          })
          .from(tasks)
          .where(and(eq(tasks.userId, userId), lt(tasks.createdAt, cursorTask.createdAt)))
          .orderBy(desc(tasks.createdAt))
          .limit(limit + 1);
      }
    }

    const results = await query;

    // Check if there's a next page
    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error('[/api/task/history] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
