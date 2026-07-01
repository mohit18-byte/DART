import { Stagehand } from '@browserbasehq/stagehand';
import logger from './logger';

export interface CDPConnection {
  stagehand: Stagehand;
  /** Graceful disconnect */
  disconnect: () => Promise<void>;
}

/**
 * Initialize Stagehand v3 with a direct CDP connection.
 * No Playwright dependency — uses Stagehand's native CDP support.
 *
 * @param wsEndpoint - WebSocket URL from Chrome's /json/version endpoint
 *   Format: ws://localhost:{port}/devtools/browser/{id}
 */
export async function connectCDP(wsEndpoint: string): Promise<CDPConnection> {
  logger.info({ wsEndpoint }, 'Connecting Stagehand to Chrome via CDP...');

  const stagehand = new Stagehand({
    env: 'LOCAL',
    localBrowserLaunchOptions: {
      cdpUrl: wsEndpoint,
    },
    // Model config — not needed for basic CDP operations in Phase 2.
    // When act()/observe()/extract() are called without a model,
    // Stagehand will throw a descriptive error. Phase 3 adds Claude.
    serverCache: false,
    verbose: 0, // Quiet — we use our own logger
  });

  await stagehand.init();

  logger.info('Stagehand connected to Chrome via CDP');

  return {
    stagehand,
    disconnect: async () => {
      try {
        await stagehand.close();
        logger.info('Stagehand disconnected');
      } catch (err) {
        logger.warn({ err }, 'Error during Stagehand disconnect');
      }
    },
  };
}
