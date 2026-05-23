import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractPage } from '../../src/core/extractPage';

describe('extractPage', () => {
  it('extracts title, content html, and attachments while excluding comments ui', () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <main data-testid="page-content">
            <h1>Runbook</h1>
            <p>Deploy safely.</p>
            <a href="/wiki/download/attachments/12/checklist.pdf">checklist.pdf</a>
          </main>
          <div data-testid="inline-comment-marker">comment badge</div>
        </body>
      </html>
    `, { url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook' });

    expect(extractPage(dom.window.document, dom.window.location.href)).toEqual({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<p>Deploy safely.</p><a href="https://workspace.atlassian.net/wiki/download/attachments/12/checklist.pdf">checklist.pdf</a>',
      assets: [
        {
          type: 'attachment',
          label: 'checklist.pdf',
          url: 'https://workspace.atlassian.net/wiki/download/attachments/12/checklist.pdf'
        }
      ]
    });
  });
});
