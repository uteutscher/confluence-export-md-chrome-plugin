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

  it('converts panels, task lists, and ignores macros without warnings', () => {
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
    expect(result.markdown).not.toContain('Roadmap macro');
    expect(result.markdown).not.toContain('[Unsupported macro: roadmap]');
    expect(result.warnings).toEqual([]);
  });

  it('preserves tables as raw html when html table export is selected', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<p>Before</p><table><tr><th>A</th></tr><tr><td><a href="/wiki/spaces/ENG/pages/7/Checklist">B</a></td></tr></table><p>After</p>',
      assets: []
    }, { tableFormat: 'html' } as never);

    expect(result.markdown).toContain('Before');
    expect(result.markdown).toContain('<table>');
    expect(result.markdown).toContain('https://workspace.atlassian.net/wiki/spaces/ENG/pages/7/Checklist');
    expect(result.markdown).toContain('After');
  });
});
