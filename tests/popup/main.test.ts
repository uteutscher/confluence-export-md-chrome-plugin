import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('popup bootstrap', () => {
  const sendMessage = vi.fn();
  const set = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    sendMessage.mockReset();
    set.mockReset();
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
      },
      storage: {
        local: {
          set
        }
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persists table format changes and sends the selected format on export', async () => {
    await import('../../src/popup/main');

    const select = document.querySelector<HTMLSelectElement>('#table-format');
    const button = document.querySelector<HTMLButtonElement>('#export-button');

    expect(select?.value).toBe('markdown');

    select!.value = 'html';
    select!.dispatchEvent(new Event('change'));

    expect(set).toHaveBeenCalledWith({ tableFormat: 'html' });

    button!.click();

    expect(sendMessage).toHaveBeenNthCalledWith(2, { type: 'start-export', options: { tableFormat: 'html' } }, expect.any(Function));
  });
});
