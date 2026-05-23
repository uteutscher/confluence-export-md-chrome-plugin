import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { exportCurrentPage } from '../../src/content/exportCurrentPage';

describe('exportCurrentPage', () => {
  it('returns markdown and warnings for the current document', () => {
    const dom = new JSDOM(`
      <main data-testid="page-content">
        <h1>Runbook</h1>
        <div data-panel-type="warning"><p>Rotate credentials.</p></div>
      </main>
    `, { url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook' });

    expect(exportCurrentPage(dom.window.document, dom.window.location.href)).toEqual({
      markdown: '# Runbook\n\n> **Warning:** Rotate credentials.',
      warnings: []
    });
  });

  it('converts tables to markdown even if an old html option value is passed', () => {
    const dom = new JSDOM(`
      <main data-testid="page-content">
        <h1>Runbook</h1>
        <p>Before</p>
        <table><tr><th>A</th></tr><tr><td>B</td></tr></table>
      </main>
    `, { url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook' });

    const result = exportCurrentPage(dom.window.document, dom.window.location.href, { tableFormat: 'html' } as never);

    expect(result.markdown).toContain('# Runbook');
    expect(result.markdown).toContain('Before');
    expect(result.markdown).toContain('| A |');
    expect(result.markdown).toContain('| --- |');
    expect(result.markdown).toContain('| B |');
    expect(result.markdown).not.toContain('<table>');
    expect(result.warnings).toEqual([]);
  });
});
