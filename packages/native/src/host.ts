import { type NativeIncoming, type StepEvent } from '@dart/shared';
import { runAgentLoop, type AgentLoopCallbacks } from '@dart/agent';
import { readMessage, writeMessage } from './messaging';
import { launchChrome, type ChromeEndpoint } from './chrome-launcher';
import { connectCDP, type CDPConnection } from './cdp';
import logger from './logger';

/**
 * Native Messaging Host — the bridge between Chrome extension and the agent.
 *
 * Lifecycle:
 * 1. Extension opens a port via chrome.runtime.connectNative('app.dart.agent')
 * 2. Chrome spawns this binary as a subprocess
 * 3. Binary reads commands from stdin, writes events to stdout
 * 4. Binary launches/connects Chrome via CDP, runs the agent loop
 */

let chromeEndpoint: ChromeEndpoint | null = null;
let cdpConnection: CDPConnection | null = null;
let currentAbortController: AbortController | null = null;

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

  // Launch or connect to Chrome
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

  // Connect Stagehand via CDP
  cdpConnection = await connectCDP(chromeEndpoint.wsEndpoint);

  return cdpConnection;
}

// ── Handle incoming messages ──

async function handleMessage(msg: ReturnType<typeof import('@dart/shared').NativeOutgoingSchema.parse>): Promise<void> {
  switch (msg.type) {
    case 'task:start': {
      logger.info({ command: msg.command }, 'Task started');

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

        const result = await runAgentLoop({
          command: msg.command,
          taskId,
          stagehand: connection.stagehand,
          signal: abortController.signal,
          callbacks,
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
      send({
        type: 'task:status',
        taskId: msg.taskId,
        status: 'cancelled',
      });
      break;
    }

    case 'task:pause': {
      logger.info({ taskId: msg.taskId }, 'Task paused');
      // Phase 2: pause is acknowledged but loop doesn't truly pause yet
      send({
        type: 'task:status',
        taskId: msg.taskId,
        status: 'paused',
      });
      break;
    }

    case 'task:resume': {
      logger.info({ taskId: msg.taskId }, 'Task resumed');
      send({
        type: 'task:status',
        taskId: msg.taskId,
        status: 'running',
      });
      break;
    }

    case 'user:response': {
      logger.info({ taskId: msg.taskId, response: msg.response }, 'User response received');
      // Phase 3: forward to agent loop
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
      // Don't break on parse errors — keep listening
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
  // Put stdin in binary/raw mode for the 4-byte protocol
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  logger.info('Dart native host started (v0.1.0)');

  // Signal ready to the extension
  send({ type: 'status:ready', version: '0.1.0' });

  // Start listening for messages
  await messageLoop();
  await shutdown();
}
