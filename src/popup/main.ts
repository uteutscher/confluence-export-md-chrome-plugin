import './styles.css';
import { renderPopup, type PopupState } from './app';

const root = document.querySelector('#app') as HTMLElement;
renderPopup(root, { kind: 'loading' });

chrome.runtime.sendMessage({ type: 'get-popup-state' }, (response: { ok: boolean; state: PopupState }) => {
  renderPopup(root, response.state);

  const button = document.querySelector<HTMLButtonElement>('#export-button');
  if (button === null || response.state.kind !== 'ready') {
    return;
  }

  button.addEventListener('click', () => {
    renderPopup(root, { kind: 'loading' });
    chrome.runtime.sendMessage({ type: 'start-export' }, (exportResponse: { ok: boolean; state: PopupState }) => {
      if (!exportResponse || exportResponse.ok !== true) {
        renderPopup(root, {
          kind: 'error',
          message: exportResponse?.state?.message || 'The export did not return a valid response.'
        });
        return;
      }
      renderPopup(root, exportResponse.state);
    });
  });
});
