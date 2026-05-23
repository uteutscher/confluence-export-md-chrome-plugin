import { createMarkdownFileName } from '../core/filename';
import { getPageEligibility } from '../core/pageEligibility';

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error('Could not determine the active tab.');
  }
  return tab;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message?.type === 'get-popup-state') {
        const tab = await getActiveTab();
        const eligibility = getPageEligibility(new URL(tab.url));
        sendResponse(
          eligibility.ok
            ? { ok: true, state: { kind: 'ready' } }
            : { ok: true, state: { kind: 'unsupported', message: eligibility.reason } }
        );
        return;
      }

      if (message?.type === 'start-export') {
        const tab = await getActiveTab();
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'export-current-page' });
        if (response.ok !== true) {
          throw new Error(response.error || 'Export failed.');
        }

        const fileName = createMarkdownFileName(response.payload.markdown.split('\n')[0].replace(/^# /, ''));
        const url = URL.createObjectURL(new Blob([response.payload.markdown], { type: 'text/markdown' }));

        await chrome.downloads.download({ url, filename: fileName, saveAs: false });
        sendResponse({
          ok: true,
          state: {
            kind: 'success',
            message:
              response.payload.warnings.length > 0
                ? `Export complete with ${response.payload.warnings.length} warning(s).`
                : 'Export complete.'
          }
        });
      }
    } catch (error) {
      sendResponse({
        ok: false,
        state: {
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unexpected export error.'
        }
      });
    }
  })();

  return true;
});
