import { createMarkdownDownloadUrl } from '../core/downloadUrl';
import { createMarkdownFileName } from '../core/filename';
import { getPageEligibility } from '../core/pageEligibility';
import type { ExportOptions } from '../core/types';

async function getActiveTab(): Promise<{ id: number; url: string }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error('Could not determine the active tab.');
  }
  return { id: tab.id, url: tab.url };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message?.type === 'get-popup-state') {
        const tab = await getActiveTab();
        const eligibility = getPageEligibility(new URL(tab.url));
        sendResponse(
          eligibility.ok
            ? { ok: true, state: { kind: 'ready', tableFormat: 'markdown' as const } }
            : { ok: true, state: { kind: 'unsupported', message: eligibility.reason } }
        );
        return;
      }

      if (message?.type === 'start-export') {
        const tab = await getActiveTab();
        const options: ExportOptions = { tableFormat: 'markdown' };
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'export-current-page', options });
        
        if (!response || response.ok !== true) {
          throw new Error(response?.error || 'Export failed.');
        }

        const titleLine = response.payload.markdown.split('\n')[0];
        const title = titleLine.startsWith('# ') ? titleLine.replace(/^# /, '') : 'confluence-export';
        const fileName = createMarkdownFileName(title);
        const url = createMarkdownDownloadUrl(response.payload.markdown);

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
        return;
      }

      sendResponse({
        ok: false,
        state: {
          kind: 'error',
          message: 'Unknown message type.'
        }
      });
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
