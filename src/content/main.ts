import { exportCurrentPage } from './exportCurrentPage';

type ExportMessageResponse =
  | { ok: true; payload: { markdown: string; warnings: { code: string; message: string }[] } }
  | { ok: false; error: string };

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'export-current-page') {
    return false;
  }

  try {
    const result = exportCurrentPage(document, window.location.href);
    const response: ExportMessageResponse = {
      ok: true,
      payload: result
    };
    sendResponse(response);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unexpected export error.';
    const response: ExportMessageResponse = { ok: false, error: messageText };
    sendResponse(response);
  }

  return true;
});
