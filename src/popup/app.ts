export type PopupState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'unsupported'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function renderPopup(root: HTMLElement, state: PopupState): void {
  root.innerHTML = '';

  if (state.kind === 'loading') {
    const p = document.createElement('p');
    p.textContent = 'Checking page…';
    root.appendChild(p);
    return;
  }

  if (state.kind === 'unsupported') {
    const p = document.createElement('p');
    p.textContent = state.message;
    const button = document.createElement('button');
    button.textContent = 'Export Markdown';
    button.disabled = true;
    root.appendChild(p);
    root.appendChild(button);
    return;
  }

  if (state.kind === 'ready') {
    const button = document.createElement('button');
    button.id = 'export-button';
    button.textContent = 'Export Markdown';
    const p = document.createElement('p');
    p.id = 'status';
    root.appendChild(button);
    root.appendChild(p);
    return;
  }

  const p = document.createElement('p');
  p.textContent = state.message;
  root.appendChild(p);
}
