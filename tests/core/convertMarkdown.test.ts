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

  it('converts panels, task lists, and unsupported macros into readable markdown with warnings', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: `
        <div data-panel-type="warning"><p>Rotate credentials.</p></div>
        <span data-testid="status-lozenge">In Progress</span>
        <ul data-task-list="true"><li><input type="checkbox" checked />Done</li><li><input type="checkbox" />Next</li></ul>
        <div data-macro-name="roadmap">Roadmap macro</div>
      `,
      assets: []
    });

    expect(result.markdown).toContain('> **Warning:** Rotate credentials.');
    expect(result.markdown).toContain('[Status: In Progress]');
    expect(result.markdown).toContain('- [x] Done');
    expect(result.markdown).toContain('- [ ] Next');
    expect(result.markdown).toContain('[Unsupported macro: roadmap]');
    expect(result.warnings).toEqual([
      { code: 'unsupported-macro', message: 'Unsupported macro converted to placeholder: roadmap' }
    ]);
  });
});
