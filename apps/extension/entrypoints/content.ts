// Content script — injects Shadow DOM overlay for element highlighting
// Uses vanilla CSS only (no Tailwind) — Shadow DOM compatible

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    // ── Create Shadow DOM host ──
    const host = document.createElement('dart-overlay');
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });

    // ── Inject overlay styles ──
    const style = document.createElement('style');
    style.textContent = `
      .dart-highlight {
        position: fixed;
        border: 2px solid rgba(204, 120, 92, 0.8);
        border-radius: 4px;
        box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.25), 0 0 20px rgba(204, 120, 92, 0.15);
        pointer-events: none;
        transition: all 150ms ease;
        animation: dart-pulse 1.5s ease-in-out infinite;
        z-index: 2147483647;
      }

      .dart-highlight-label {
        position: fixed;
        background: rgba(20, 20, 19, 0.9);
        color: #faf9f5;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 4px;
        pointer-events: none;
        white-space: nowrap;
        z-index: 2147483647;
        animation: dart-fade-in 200ms ease;
      }

      @keyframes dart-pulse {
        0%, 100% { box-shadow: 0 0 0 3px rgba(204, 120, 92, 0.25), 0 0 20px rgba(204, 120, 92, 0.15); }
        50% { box-shadow: 0 0 0 4px rgba(204, 120, 92, 0.4), 0 0 30px rgba(204, 120, 92, 0.25); }
      }

      @keyframes dart-fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    shadow.appendChild(style);

    // ── Highlight container ──
    const container = document.createElement('div');
    shadow.appendChild(container);

    // ── Message listener ──
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'highlight:element') {
        highlightElement(message.rect, message.label);
        sendResponse({ success: true });
      } else if (message.type === 'highlight:clear') {
        clearHighlight();
        sendResponse({ success: true });
      }
      return true;
    });

    let highlightEl: HTMLDivElement | null = null;
    let labelEl: HTMLDivElement | null = null;

    function highlightElement(rect: { x: number; y: number; width: number; height: number }, label?: string) {
      clearHighlight();

      highlightEl = document.createElement('div');
      highlightEl.className = 'dart-highlight';
      highlightEl.style.left = `${rect.x}px`;
      highlightEl.style.top = `${rect.y}px`;
      highlightEl.style.width = `${rect.width}px`;
      highlightEl.style.height = `${rect.height}px`;
      container.appendChild(highlightEl);

      if (label) {
        labelEl = document.createElement('div');
        labelEl.className = 'dart-highlight-label';
        labelEl.textContent = label;
        labelEl.style.left = `${rect.x}px`;
        labelEl.style.top = `${Math.max(0, rect.y - 28)}px`;
        container.appendChild(labelEl);
      }
    }

    function clearHighlight() {
      if (highlightEl) {
        highlightEl.remove();
        highlightEl = null;
      }
      if (labelEl) {
        labelEl.remove();
        labelEl = null;
      }
    }

    console.log('[Dart] Content script overlay initialized');
  },
});
