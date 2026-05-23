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
        let errorMessage = 'The export did not return a valid response.';
        if (exportResponse?.state && typeof exportResponse.state === 'object' && 'message' in exportResponse.state && typeof exportResponse.state.message === 'string') {
          errorMessage = exportResponse.state.message;
        }
        renderPopup(root, {
          kind: 'error',
          message: errorMessage
        });
        return;
      }
      renderPopup(root, exportResponse.state);
    });
  });
});
