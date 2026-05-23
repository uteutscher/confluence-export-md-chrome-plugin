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
});
