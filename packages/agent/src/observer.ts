import type { Stagehand } from '@browserbasehq/stagehand';

/**
 * Page observation — captures the current state of the page
 * for the planner to decide the next action.
 *
 * Phase 2: Returns basic page metadata (URL, title).
 * Phase 3: Will use stagehand.observe() for full accessibility tree.
 */

export interface PageObservation {
  url: string;
  title: string;
  /** Raw observation data from Stagehand (Phase 3) */
  elements?: unknown[];
  /** Truncated page text content */
  textContent?: string;
}

/**
 * Observe the current page state.
 *
 * In Phase 2, this returns basic URL + title from CDP.
 * In Phase 3, this will call stagehand.page.observe() for the full
 * accessibility tree that feeds into Claude's planning prompt.
 */
export async function observePage(stagehand: Stagehand): Promise<PageObservation> {
  const page = stagehand.page;
  const url = page.url();
  const title = await page.title();

  return {
    url,
    title,
  };
}
