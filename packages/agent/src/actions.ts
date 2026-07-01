import type { Stagehand } from '@browserbasehq/stagehand';
import type { AgentAction } from '@dart/shared';
import { actionDelay, pageLoadWait } from './pacing';

/**
 * Action result returned by each executor.
 */
export interface ActionResult {
  success: boolean;
  detail?: string;
  error?: string;
}

/**
 * Execute an AgentAction against the browser via Stagehand.
 *
 * Each action type maps to a specific browser operation:
 * - navigate → page.goto()
 * - click → stagehand.page.act() (requires AI model — Phase 3)
 * - type → stagehand.page.act() (requires AI model — Phase 3)
 * - scroll → stagehand.page.act() (requires AI model — Phase 3)
 * - extract → stagehand.page.extract() (requires AI model — Phase 3)
 * - done → return result (no browser action)
 * - ask_user → pause and emit question
 * - blocked → pause and emit blocker
 */
export async function executeAction(
  action: AgentAction,
  stagehand: Stagehand,
): Promise<ActionResult> {
  const page = stagehand.page;

  switch (action.type) {
    case 'navigate': {
      try {
        await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await pageLoadWait();
        return { success: true, detail: `Navigated to ${action.url}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: `Navigation failed: ${msg}` };
      }
    }

    case 'click': {
      try {
        // Phase 2: Stagehand's act() requires an AI model.
        // This will work once Claude is integrated in Phase 3.
        await page.act({ action: `click on ${action.selector}` });
        await actionDelay();
        return { success: true, detail: `Clicked: ${action.selector}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: `Click failed: ${msg}` };
      }
    }

    case 'type': {
      try {
        await page.act({ action: `type "${action.text}" into ${action.selector}` });
        await actionDelay();
        return { success: true, detail: `Typed into: ${action.selector}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: `Type failed: ${msg}` };
      }
    }

    case 'scroll': {
      try {
        await page.act({ action: `scroll ${action.direction} ${action.amount}` });
        await actionDelay();
        return { success: true, detail: `Scrolled ${action.direction}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: `Scroll failed: ${msg}` };
      }
    }

    case 'extract': {
      try {
        const data = await page.extract({
          instruction: action.instruction,
          useTextExtract: true,
        });
        return { success: true, detail: `Extracted: ${JSON.stringify(data).slice(0, 500)}` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: `Extract failed: ${msg}` };
      }
    }

    case 'done': {
      return { success: true, detail: action.result };
    }

    case 'ask_user': {
      // The loop handles pausing — we just return the question
      return { success: true, detail: `Question: ${action.question}` };
    }

    case 'blocked': {
      // The loop handles pausing — we just return the reason
      return { success: true, detail: `Blocked: ${action.description}` };
    }

    default: {
      return { success: false, error: `Unknown action type` };
    }
  }
}
