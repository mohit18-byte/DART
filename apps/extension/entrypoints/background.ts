import { ExtensionMessageSchema } from '@dart/shared';

export default defineBackground(() => {
  // ── Side Panel Behavior ──
  // Clicking the extension icon opens the side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // ── Message Router ──
  chrome.runtime.onMessage.addListener((rawMessage, sender, sendResponse) => {
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

        // Phase 2: Forward to native binary via chrome.runtime.connectNative
        // For now, log and acknowledge
        console.log('[Dart BG] Would forward to native binary:', message.command);

        sendResponse({ success: true, message: 'Task received (native binary not connected yet)' });
        break;
      }

      case 'task:cancel': {
        console.log('[Dart BG] Task cancelled:', message.taskId);
        chrome.storage.session.set({ activeTask: null });
        sendResponse({ success: true });
        break;
      }

      case 'task:pause': {
        console.log('[Dart BG] Task paused:', message.taskId);
        sendResponse({ success: true });
        break;
      }

      case 'task:resume': {
        console.log('[Dart BG] Task resumed:', message.taskId);
        sendResponse({ success: true });
        break;
      }

      case 'user:response': {
        console.log('[Dart BG] User response:', message.response);
        sendResponse({ success: true });
        break;
      }

      default: {
        console.warn('[Dart BG] Unhandled message type');
        sendResponse({ success: false, error: 'Unhandled message type' });
      }
    }

    return true; // Keep the message channel open for async sendResponse
  });

  console.log('[Dart BG] Service worker initialized');
});
