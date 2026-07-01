import { ExtensionMessageSchema, BackgroundMessageSchema, type NativeIncoming } from '@dart/shared';

const NATIVE_HOST_NAME = 'app.dart.agent';

export default defineBackground(() => {
  // ── Side Panel Behavior ──
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // ── Native Messaging State ──
  let nativePort: chrome.runtime.Port | null = null;
  let isConnected = false;

  /**
   * Connect to the native messaging host.
   * Returns the port for bidirectional communication.
   */
  function connectToNative(): chrome.runtime.Port {
    if (nativePort) return nativePort;

    console.log('[Dart BG] Connecting to native host:', NATIVE_HOST_NAME);

    const port = chrome.runtime.connectNative(NATIVE_HOST_NAME);

    port.onMessage.addListener((rawMessage: unknown) => {
      console.log('[Dart BG] Received from native:', rawMessage);

      const parsed = BackgroundMessageSchema.safeParse(rawMessage);
      if (!parsed.success) {
        console.warn('[Dart BG] Invalid message from native:', parsed.error.format());
        return;
      }

      const message = parsed.data;

      // Track connection state
      if (message.type === 'status:ready') {
        isConnected = true;
        console.log('[Dart BG] Native host ready, version:', message.version);
      }
      if (message.type === 'status:connected') {
        console.log('[Dart BG] Chrome CDP connected on port:', message.port);
      }

      // Phase 5: Persist completed tasks to Supabase
      if (message.type === 'task:status' && message.status && ['completed', 'failed', 'cancelled'].includes(message.status)) {
        persistTask(message);
      }

      // Broadcast to all extension contexts (side panel, popup)
      broadcastToExtension(message);
    });

    port.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.log('[Dart BG] Native port disconnected:', lastError?.message ?? 'no error');
      nativePort = null;
      isConnected = false;

      // Notify extension contexts
      broadcastToExtension({
        type: 'status:error',
        error: lastError?.message ?? 'Native host disconnected',
        code: 'NATIVE_DISCONNECTED',
      });
    });

    nativePort = port;
    return port;
  }

  /**
   * Send a message to the native host.
   */
  function sendToNative(message: Record<string, unknown>): boolean {
    try {
      const port = connectToNative();
      port.postMessage(message);
      return true;
    } catch (err) {
      console.error('[Dart BG] Failed to send to native:', err);
      return false;
    }
  }

  /**
   * Broadcast a message to all extension contexts.
   */
  function broadcastToExtension(message: NativeIncoming): void {
    chrome.runtime.sendMessage(message).catch(() => {
      // No listeners — that's OK, side panel might be closed
    });
  }

  // ── Message Router ──
  chrome.runtime.onMessage.addListener((rawMessage, _sender, sendResponse) => {
    const parsed = ExtensionMessageSchema.safeParse(rawMessage);

    if (!parsed.success) {
      console.warn('[Dart BG] Invalid message received:', parsed.error.format());
      sendResponse({ success: false, error: 'Invalid message format' });
      return true;
    }

    const message = parsed.data;

    switch (message.type) {
      case 'task:start': {
        console.log('[Dart BG] Task started:', message.command);

        // Store the active command in session storage
        chrome.storage.session.set({
          activeTask: {
            command: message.command,
            status: 'running',
            startedAt: Date.now(),
          },
        });

        // Forward to native binary with Clerk auth context
        chrome.storage.local.get(['clerkUserId', 'clerkPlan', 'clerkSessionToken']).then((authData) => {
          const sent = sendToNative({
            type: 'task:start',
            command: message.command,
            userId: authData.clerkUserId ?? 'dev-user',
            plan: authData.clerkPlan ?? 'free',
            authToken: authData.clerkSessionToken,
          });

          sendResponse({
            success: sent,
            message: sent
              ? 'Task forwarded to native host'
              : 'Failed to connect to native host. Is the Dart agent installed?',
          });
        });
        break;
      }

      case 'task:cancel': {
        console.log('[Dart BG] Task cancelled:', message.taskId);
        sendToNative({ type: 'task:cancel', taskId: message.taskId });
        chrome.storage.session.set({ activeTask: null });
        sendResponse({ success: true });
        break;
      }

      case 'task:pause': {
        console.log('[Dart BG] Task paused:', message.taskId);
        sendToNative({ type: 'task:pause', taskId: message.taskId });
        sendResponse({ success: true });
        break;
      }

      case 'task:resume': {
        console.log('[Dart BG] Task resumed:', message.taskId);
        sendToNative({ type: 'task:resume', taskId: message.taskId });
        sendResponse({ success: true });
        break;
      }

      case 'user:response': {
        console.log('[Dart BG] User response:', message.response);
        sendToNative({ type: 'user:response', taskId: message.taskId, response: message.response });
        sendResponse({ success: true });
        break;
      }

      default: {
        console.warn('[Dart BG] Unhandled message type');
        sendResponse({ success: false, error: 'Unhandled message type' });
      }
    }

    return true;
  });

  /**
   * Phase 5: Persist completed tasks to /api/task/save
   */
  async function persistTask(message: Record<string, unknown>): Promise<void> {
    try {
      const syncHost = '__WXT_SYNC_HOST__'; // Build-time replaced
      const apiUrl = (typeof syncHost === 'string' && syncHost.startsWith('http'))
        ? syncHost
        : 'http://localhost:3000';

      // Get stored steps from session storage
      const sessionData = await chrome.storage.session.get(['taskSteps']);
      const steps = sessionData.taskSteps ?? [];

      // Get Clerk session token for auth
      const authData = await chrome.storage.local.get(['clerkSessionToken']);

      const response = await fetch(`${apiUrl}/api/task/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authData.clerkSessionToken ? { 'Authorization': `Bearer ${authData.clerkSessionToken}` } : {}),
        },
        body: JSON.stringify({
          taskId: message.taskId ?? crypto.randomUUID(),
          command: (await chrome.storage.session.get(['activeTask'])).activeTask?.command ?? 'unknown',
          status: message.status,
          stepCount: steps.length,
          result: message.result ?? null,
          modelUsed: null,
          steps,
        }),
      });

      if (!response.ok) {
        console.warn('[Dart BG] Failed to persist task:', response.status);
      } else {
        console.log('[Dart BG] Task persisted successfully');
      }

      // Clear session steps
      chrome.storage.session.remove(['taskSteps']);
    } catch (err) {
      console.error('[Dart BG] Error persisting task:', err);
    }
  }

  console.log('[Dart BG] Service worker initialized');
});
