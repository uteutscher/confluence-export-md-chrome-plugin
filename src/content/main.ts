import { exportCurrentPage } from './exportCurrentPage';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'export-current-page') {
    return false;
  }

  try {
    sendResponse({
      ok: true,
      payload: exportCurrentPage(document, window.location.href)
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unexpected export error.';
    sendResponse({ ok: false, error: messageText });
  }

  return true;
});
