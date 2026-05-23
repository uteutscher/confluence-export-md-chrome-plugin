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

  it('extracts content from the Confluence cloud renderer layout used on real pages', () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <span id="content-title-id">
            <h1 id="heading-title-text">Steckbrief E-Rechnung</h1>
          </span>
          <div
            id="main-content"
            data-testid="pageContentRendererTestId"
            class="wiki-content"
          >
            <div class="renderer-overrides">
              <h1>Rahmendaten</h1>
              <p>Renderer content</p>
            </div>
          </div>
        </body>
      </html>
    `, { url: 'https://dvag.atlassian.net/wiki/spaces/ITARC/pages/1232470161/Steckbrief+E-Rechnung' });

    expect(extractPage(dom.window.document, dom.window.location.href)).toEqual({
      title: 'Steckbrief E-Rechnung',
      url: 'https://dvag.atlassian.net/wiki/spaces/ITARC/pages/1232470161/Steckbrief+E-Rechnung',
      contentHtml: '<div class="renderer-overrides"><h1>Rahmendaten</h1><p>Renderer content</p></div>',
      assets: []
    });
  });
});
