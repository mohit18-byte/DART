import type { Stagehand } from '@browserbasehq/stagehand';

/**
 * Page observation — captures the current state of the page
 * for the planner to decide the next action.
 *
 * Phase 3: Returns URL, title, and text content from Stagehand.
 * Token budget: trimmed to 5KB max to fit within context windows.
 */

export interface PageObservation {
  url: string;
  title: string;
  /** Simplified page content for the AI planner */
  textContent: string;
}

/**
 * Observe the current page state via Stagehand.
 *
 * Extracts URL, title, and a text representation of the page
 * suitable for feeding into the AI planner's context window.
 */
export async function observePage(stagehand: Stagehand): Promise<PageObservation> {
  const page = stagehand.context.activePage();
  if (!page) {
    return { url: 'about:blank', title: '', textContent: '[No active page]' };
  }

  const url = page.url();
  const title = await page.title();

  // Extract visible text content for the AI planner.
  // We use page.evaluate with a string expression so that DOM globals
  // (document, NodeFilter, getComputedStyle) are resolved at runtime in the
  // browser context rather than at compile time in the Node/TS context.
  let textContent = '';
  try {
    textContent = await page.evaluate<string>(`
      (() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;

              const style = getComputedStyle(parent);
              if (style.display === 'none' || style.visibility === 'hidden') {
                return NodeFilter.FILTER_REJECT;
              }

              const tag = parent.tagName.toLowerCase();
              if (['script', 'style', 'noscript', 'svg'].includes(tag)) {
                return NodeFilter.FILTER_REJECT;
              }

              if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;

              return NodeFilter.FILTER_ACCEPT;
            },
          },
        );

        const texts = [];
        let totalLength = 0;
        const MAX_LENGTH = 4500;

        while (walker.nextNode() && totalLength < MAX_LENGTH) {
          const text = walker.currentNode.textContent?.trim();
          if (text && text.length > 1) {
            texts.push(text);
            totalLength += text.length;
          }
        }

        return texts.join(' ');
      })()
    `);
  } catch {
    // Evaluate can fail on some pages (about:blank, chrome:// etc.)
    textContent = '[Unable to extract page content]';
  }

  // Build structured observation
  const observation: PageObservation = {
    url,
    title,
    textContent: textContent.slice(0, 4500),
  };

  return observation;
}

/**
 * Format a PageObservation into a string for the AI prompt.
 */
export function formatObservation(obs: PageObservation): string {
  return `URL: ${obs.url}
Title: ${obs.title}
Page Content: ${obs.textContent || '[empty page]'}`;
}
