import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('popup bootstrap', () => {
  const sendMessage = vi.fn();
  beforeEach(() => {
    vi.resetModules();
    sendMessage.mockReset();
    document.body.innerHTML = '<div id="app"></div>';

    sendMessage.mockImplementation((message: { type: string }, callback?: (response: unknown) => void) => {
      if (message.type === 'get-popup-state') {
        callback?.({
          ok: true,
          state: {
            kind: 'ready',
            tableFormat: 'markdown'
          }
        });
        return;
      }

      if (message.type === 'start-export') {
        callback?.({
          ok: true,
          state: {
            kind: 'success',
            message: 'Export complete.'
          }
        });
      }
    });

    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('always sends markdown on export', async () => {
    await import('../../src/popup/main');

    const button = document.querySelector<HTMLButtonElement>('#export-button');

    button!.click();

    expect(sendMessage).toHaveBeenNthCalledWith(2, { type: 'start-export', options: { tableFormat: 'markdown' } }, expect.any(Function));
  });
});
