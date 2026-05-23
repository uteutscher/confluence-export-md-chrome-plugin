import { describe, expect, it } from 'vitest';
import { renderPopup } from '../../src/popup/app';

describe('renderPopup', () => {
  it('shows a disabled button and explanation for unsupported pages', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPopup(document.querySelector('#app') as HTMLElement, {
      kind: 'unsupported',
      message: 'This tab is not a Confluence Cloud page.'
    });

    expect(document.body.textContent).toContain('This tab is not a Confluence Cloud page.');
    expect(document.querySelector('button')?.hasAttribute('disabled')).toBe(true);
  });

  it('shows only a message without a button for success states', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPopup(document.querySelector('#app') as HTMLElement, {
      kind: 'success',
      message: 'Export complete.'
    });

    expect(document.body.textContent).toContain('Export complete.');
    expect(document.querySelector('button')).toBeNull();
  });

  it('shows only a message without a button for error states', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPopup(document.querySelector('#app') as HTMLElement, {
      kind: 'error',
      message: 'Export failed.'
    });

    expect(document.body.textContent).toContain('Export failed.');
    expect(document.querySelector('button')).toBeNull();
  });

  it('shows a table format selector and export button for ready state', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPopup(document.querySelector('#app') as HTMLElement, {
      kind: 'ready',
      tableFormat: 'markdown'
    } as never);

    expect(document.querySelector('label')?.textContent).toContain('Table format');
    expect(document.querySelector<HTMLSelectElement>('#table-format')?.value).toBe('markdown');
    expect(document.querySelectorAll('option')).toHaveLength(2);
    expect(document.querySelector<HTMLButtonElement>('#export-button')?.textContent).toBe('Export Markdown');
  });
});
