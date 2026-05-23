import { describe, expect, it } from 'vitest';
import { convertExtractedPageToMarkdown } from '../../src/core/convertMarkdown';

describe('convertExtractedPageToMarkdown', () => {
  it('converts standard html structures to gfm and prepends the title', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: `
        <h2>Deploy</h2>
        <p>Open the <a href="/wiki/spaces/ENG/pages/7/Checklist">checklist</a>.</p>
        <pre><code class="language-bash">echo hello</code></pre>
      `,
      assets: []
    });

    expect(result).toEqual({
      markdown: '# Runbook\n\n## Deploy\n\nOpen the [checklist](https://workspace.atlassian.net/wiki/spaces/ENG/pages/7/Checklist).\n\n```bash\necho hello\n```',
      warnings: []
    });
  });
});
