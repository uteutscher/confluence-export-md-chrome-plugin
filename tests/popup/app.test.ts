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
});
