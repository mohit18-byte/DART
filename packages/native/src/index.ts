/**
 * Dart Native Agent — Entry Point
 *
 * This file is the compiled binary entry.
 * Run: bun build --compile src/index.ts --outfile dist/dart-agent
 */

import { startHost } from './host';
import logger from './logger';

async function main(): Promise<void> {
  try {
    await startHost();
  } catch (err) {
    logger.fatal({ err }, 'Fatal error in native host');
    process.exit(1);
  }
}

main();
