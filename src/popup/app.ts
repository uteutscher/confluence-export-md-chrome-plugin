import type { TableFormat } from '../core/types';

export type PopupState =
  | { kind: 'loading' }
  | { kind: 'ready'; tableFormat: TableFormat }
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
    const label = document.createElement('label');
    label.htmlFor = 'table-format';
    label.textContent = 'Table format';
    const select = document.createElement('select');
    select.id = 'table-format';

    [
      { value: 'markdown', label: 'Markdown' },
      { value: 'html', label: 'HTML' }
    ].forEach((optionConfig) => {
      const option = document.createElement('option');
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      option.selected = optionConfig.value === state.tableFormat;
      select.appendChild(option);
    });

    const button = document.createElement('button');
    button.id = 'export-button';
    button.textContent = 'Export Markdown';
    const p = document.createElement('p');
    p.id = 'status';
    root.appendChild(label);
    root.appendChild(select);
    root.appendChild(button);
    root.appendChild(p);
    return;
  }

  const p = document.createElement('p');
  p.textContent = state.message;
  root.appendChild(p);
}
