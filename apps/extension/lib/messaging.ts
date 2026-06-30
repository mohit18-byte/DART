import type { ExtensionMessage, BackgroundMessage } from '@dart/shared';
import { ExtensionMessageSchema, BackgroundMessageSchema } from '@dart/shared';

/**
 * Send a validated message to the background service worker.
 * Returns the service worker's response.
 */
export async function sendToBackground(
  message: ExtensionMessage,
): Promise<{ success: boolean; message?: string; error?: string }> {
  // Validate outgoing message
  const validated = ExtensionMessageSchema.parse(message);
  return chrome.runtime.sendMessage(validated);
}

/**
 * Listen for messages from the background service worker.
 * Messages are validated against the BackgroundMessage schema.
 */
export function onBackgroundMessage(
  handler: (message: BackgroundMessage) => void,
): () => void {
  const listener = (rawMessage: unknown) => {
    const parsed = BackgroundMessageSchema.safeParse(rawMessage);
    if (parsed.success) {
      handler(parsed.data);
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  // Return cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}

/**
 * Generate a UUID v4 for task/step IDs.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
