export type PopupState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'unsupported'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function renderPopup(root: HTMLElement, state: PopupState): void {
  if (state.kind === 'loading') {
    root.innerHTML = '<p>Checking page…</p>';
    return;
  }

  if (state.kind === 'unsupported') {
    root.innerHTML = `<p>${state.message}</p><button disabled>Export Markdown</button>`;
    return;
  }

  if (state.kind === 'ready') {
    root.innerHTML = '<button id="export-button">Export Markdown</button><p id="status"></p>';
    return;
  }

  root.innerHTML = `<p>${state.message}</p>`;
}
