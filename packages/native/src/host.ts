import { type NativeIncoming, type StepEvent } from '@dart/shared';
import { runAgentLoop, type AgentLoopCallbacks, type PlannerConfig } from '@dart/agent';
import { readMessage, writeMessage } from './messaging';
import { launchChrome, type ChromeEndpoint } from './chrome-launcher';
import { connectCDP, type CDPConnection } from './cdp';
import logger from './logger';

/**
 * Native Messaging Host — the bridge between Chrome extension and the agent.
 *
 * Phase 3: Now forwards auth tokens and planner config to the agent loop.
 * The agent calls /api/agent/run on the Next.js server for AI planning.
 */

let chromeEndpoint: ChromeEndpoint | null = null;
let cdpConnection: CDPConnection | null = null;
let currentAbortController: AbortController | null = null;

// ── Default planner config ──
const DEFAULT_API_BASE = process.env.DART_API_URL ?? 'http://localhost:3000';
const DEFAULT_USER_ID = process.env.DART_USER_ID ?? 'dev-user';
const DEFAULT_PLAN = (process.env.DART_PLAN as 'free' | 'pro' | 'power') ?? 'free';

// ── Send a message back to the extension ──

function send(msg: NativeIncoming): void {
  try {
    writeMessage(msg);
  } catch (err) {
    logger.error({ err }, 'Failed to send message to extension');
  }
}

// ── Initialize Chrome + CDP connection ──

async function ensureConnection(): Promise<CDPConnection> {
  if (cdpConnection) return cdpConnection;

  chromeEndpoint = await launchChrome((warning) => {
    send({
      type: 'status:error',
      error: warning,
      code: 'CHROME_RESTART_WARNING',
    });
  });

  send({
    type: 'status:connected',
    port: chromeEndpoint.port,
  });

  cdpConnection = await connectCDP(chromeEndpoint.wsEndpoint);
  return cdpConnection;
}

// ── Handle incoming messages ──

async function handleMessage(
  msg: ReturnType<typeof import('@dart/shared').NativeOutgoingSchema.parse>,
): Promise<void> {
  switch (msg.type) {
    case 'task:start': {
      const command = msg.command;
      // Extract optional auth fields (Phase 3: placeholder, Phase 5: real Clerk JWT)
      const authToken = (msg as Record<string, unknown>).authToken as string | undefined;
      const userId = (msg as Record<string, unknown>).userId as string | undefined;
      const plan = (msg as Record<string, unknown>).plan as string | undefined;

      logger.info({ command, userId }, 'Task started');

      // Cancel any running task
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }

      try {
        const connection = await ensureConnection();
        const abortController = new AbortController();
        currentAbortController = abortController;

        const taskId = crypto.randomUUID();

        const callbacks: AgentLoopCallbacks = {
          onStep(step: StepEvent) {
            send({ type: 'step:update', step });
          },
          onBlocked(step: StepEvent, reason: string) {
            send({ type: 'step:blocked', step, reason });
          },
          onAskUser(step: StepEvent, question: string) {
            send({ type: 'step:ask_user', step, question });
          },
        };

        // Build planner config for AI integration
        const plannerConfig: PlannerConfig = {
          apiBaseUrl: DEFAULT_API_BASE,
          userId: userId ?? DEFAULT_USER_ID,
          plan: (plan as 'free' | 'pro' | 'power') ?? DEFAULT_PLAN,
          ...(authToken != null && { authToken }),
        };

        const result = await runAgentLoop({
          command,
          taskId,
          stagehand: connection.stagehand,
          signal: abortController.signal,
          callbacks,
          plannerConfig,
        });

        send({
          type: 'task:status',
          taskId,
          status: result.status,
          result: result.summary,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error({ err: errorMessage }, 'Task execution failed');
        send({
          type: 'status:error',
          error: `Task failed: ${errorMessage}`,
          code: 'TASK_EXECUTION_ERROR',
        });
      } finally {
        currentAbortController = null;
      }
      break;
    }

    case 'task:cancel': {
      logger.info({ taskId: msg.taskId }, 'Task cancelled');
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      send({ type: 'task:status', taskId: msg.taskId, status: 'cancelled' });
      break;
    }

    case 'task:pause': {
      logger.info({ taskId: msg.taskId }, 'Task paused');
      send({ type: 'task:status', taskId: msg.taskId, status: 'paused' });
      break;
    }

    case 'task:resume': {
      logger.info({ taskId: msg.taskId }, 'Task resumed');
      send({ type: 'task:status', taskId: msg.taskId, status: 'running' });
      break;
    }

    case 'user:response': {
      logger.info({ taskId: msg.taskId, response: msg.response }, 'User response received');
      // TODO Phase 4: Forward to agent loop's waiting handler
      break;
    }
  }
}

// ── Message loop ──

async function messageLoop(): Promise<void> {
  logger.info('Starting message loop...');

  while (true) {
    try {
      const message = await readMessage();
      await handleMessage(message);
    } catch (err) {
      if (err instanceof Error && err.message.includes('stdin closed')) {
        logger.info('stdin closed — extension disconnected, shutting down');
        break;
      }
      logger.error({ err }, 'Error in message loop');
    }
  }
}

// ── Graceful shutdown ──

async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  if (currentAbortController) {
    currentAbortController.abort();
  }
  if (cdpConnection) {
    await cdpConnection.disconnect();
  }
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ── Main entry ──

export async function startHost(): Promise<void> {
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  logger.info('Dart native host started (v0.1.0)');
  send({ type: 'status:ready', version: '0.1.0' });
  await messageLoop();
  await shutdown();
}
