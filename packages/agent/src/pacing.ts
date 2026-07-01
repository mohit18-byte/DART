/**
 * Human-like pacing utilities.
 *
 * The agent deliberately pauses between actions to:
 * 1. Appear human to anti-bot detection
 * 2. Allow page JS to settle
 * 3. Give the user time to observe what's happening
 */

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Delay between actions — 800 to 2500ms.
 * Simulates a human reading the page and deciding what to do next.
 */
export async function actionDelay(): Promise<void> {
  const ms = randomBetween(800, 2500);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Per-keystroke delay — 50 to 150ms.
 * Simulates human typing speed (~60-120 WPM).
 */
export function keystrokeDelay(): number {
  return randomBetween(50, 150);
}

/**
 * Wait for page load to settle.
 * Waits for the page's load event + a 500ms buffer for late JS execution.
 */
export async function pageLoadWait(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

/**
 * Short delay for UI responsiveness — 200 to 500ms.
 * Used after simple actions like scrolling.
 */
export async function shortDelay(): Promise<void> {
  const ms = randomBetween(200, 500);
  await new Promise((resolve) => setTimeout(resolve, ms));
}
