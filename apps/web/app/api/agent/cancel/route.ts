import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { setCancelFlag } from '@/lib/rate-limit';

// ── Request Schema ──

const RequestSchema = z.object({
  taskId: z.string().uuid(),
  userId: z.string().min(1),
});

// ── POST /api/agent/cancel ──

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { taskId } = parsed.data;

    // Phase 3: userId from request body (placeholder auth)
    // Phase 5: Extract from Clerk JWT

    await setCancelFlag(taskId);

    return NextResponse.json({ cancelled: true, taskId });
  } catch (err) {
    console.error('[/api/agent/cancel] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
