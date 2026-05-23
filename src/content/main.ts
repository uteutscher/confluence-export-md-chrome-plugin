import { exportCurrentPage } from './exportCurrentPage';
import type { ExportOptions } from '../core/types';

type ExportMessageResponse =
  | { ok: true; payload: { markdown: string; warnings: { code: string; message: string }[] } }
  | { ok: false; error: string };

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'export-current-page') {
    return false;
  }

  try {
    const options: ExportOptions =
      message?.options?.tableFormat === 'html' ? { tableFormat: 'html' } : { tableFormat: 'markdown' };
    const result = exportCurrentPage(document, window.location.href, options);
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
