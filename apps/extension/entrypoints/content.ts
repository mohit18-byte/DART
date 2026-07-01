/**
 * Dart Content Script — Element Highlight Overlay
 *
 * Draws a glowing border around elements the agent is about to interact with.
 * All styles live inside Shadow DOM to prevent CSS conflicts with the host page.
 */
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',

  main() {
    let overlay: HTMLDivElement | null = null;
    let label: HTMLDivElement | null = null;
    let shadowHost: HTMLDivElement | null = null;
    let shadowRoot: ShadowRoot | null = null;

    function createShadowContainer(): ShadowRoot {
      if (shadowRoot) return shadowRoot;

      shadowHost = document.createElement('div');
      shadowHost.id = 'dart-overlay-host';
      shadowHost.style.cssText = 'all:initial; position:absolute; top:0; left:0; z-index:2147483647; pointer-events:none;';
      document.body.appendChild(shadowHost);
      shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

      // Inject styles into shadow DOM
      const style = document.createElement('style');
      style.textContent = `
        .dart-overlay {
          position: absolute;
          border: 2px solid rgba(204, 120, 92, 0.7);
          border-radius: 6px;
          background: rgba(204, 120, 92, 0.06);
          box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.25), 0 0 20px rgba(204, 120, 92, 0.15);
          pointer-events: none;
          transition: all 200ms ease;
          animation: dart-pulse 2s ease-in-out infinite;
        }
        .dart-label {
          position: absolute;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          background: rgba(204, 120, 92, 0.9);
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
          pointer-events: none;
          transform: translateY(-100%) translateY(-6px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        @keyframes dart-pulse {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.25), 0 0 20px rgba(204, 120, 92, 0.15);
          }
          50% {
            box-shadow: 0 0 0 5px rgba(204, 120, 92, 0.35), 0 0 30px rgba(204, 120, 92, 0.25);
          }
        }
      `;
      shadowRoot.appendChild(style);

      return shadowRoot;
    }

    function highlightElement(selector: string, actionLabel?: string): void {
      removeHighlight();

      // Try to find the element by various strategies
      let element: Element | null = null;

      // 1. Try CSS selector
      try {
        element = document.querySelector(selector);
      } catch { /* not a valid CSS selector */ }

      // 2. Try text content matching
      if (!element) {
        const allElements = document.querySelectorAll('button, a, input, textarea, [role="button"], [role="link"]');
        for (const el of allElements) {
          if (el.textContent?.toLowerCase().includes(selector.toLowerCase())) {
            element = el;
            break;
          }
        }
      }

      if (!element) return;

      const root = createShadowContainer();
      const rect = element.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Create overlay
      overlay = document.createElement('div');
      overlay.className = 'dart-overlay';
      overlay.style.cssText = `
        left: ${rect.left + scrollX - 4}px;
        top: ${rect.top + scrollY - 4}px;
        width: ${rect.width + 8}px;
        height: ${rect.height + 8}px;
      `;
      root.appendChild(overlay);

      // Create label
      if (actionLabel) {
        label = document.createElement('div');
        label.className = 'dart-label';
        label.textContent = actionLabel;
        label.style.cssText = `
          left: ${rect.left + scrollX - 4}px;
          top: ${rect.top + scrollY - 4}px;
        `;
        root.appendChild(label);
      }
    }

    function removeHighlight(): void {
      if (overlay && shadowRoot) {
        shadowRoot.removeChild(overlay);
        overlay = null;
      }
      if (label && shadowRoot) {
        shadowRoot.removeChild(label);
        label = null;
      }
    }

    // Listen for messages from the service worker
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'highlight:element') {
        highlightElement(message.selector, message.label);
        sendResponse({ success: true });

        // Auto-remove after 3 seconds
        setTimeout(removeHighlight, 3000);
      }

      if (message?.type === 'highlight:clear') {
        removeHighlight();
        sendResponse({ success: true });
      }

      return true;
    });
  },
});
