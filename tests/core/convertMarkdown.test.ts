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

  it('ignores extension-based confluence macros without exporting their placeholder text', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: `
        <p>Before</p>
        <div data-node-type="extension" data-extension-key="jira">
          Jira macro placeholder
        </div>
        <span data-node-type="inlineExtension" data-extension-key="status">
          Inline macro placeholder
        </span>
        <div data-node-type="bodiedExtension" data-extension-key="roadmap">
          Bodied macro placeholder
        </div>
        <p>After</p>
      `,
      assets: []
    });

    expect(result.markdown).toContain('Before');
    expect(result.markdown).toContain('After');
    expect(result.markdown).not.toContain('Jira macro placeholder');
    expect(result.markdown).not.toContain('Inline macro placeholder');
    expect(result.markdown).not.toContain('Bodied macro placeholder');
    expect(result.warnings).toEqual([]);
  });

  it('removes cdata wrappers from normal export content while preserving inner text', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<p>Prefix <![CDATA[important payload]]> suffix</p>',
      assets: []
    });

    expect(result.markdown).toContain('Prefix important payload suffix');
    expect(result.markdown).not.toContain('<![CDATA[');
    expect(result.markdown).not.toContain(']]>');
  });

  it('removes cdata wrappers from code blocks while preserving code content', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<pre><code><![CDATA[<tag>value</tag>]]></code></pre>',
      assets: []
    });

    expect(result.markdown).toContain('```');
    expect(result.markdown).toContain('<tag>value</tag>');
    expect(result.markdown).not.toContain('<![CDATA[');
    expect(result.markdown).not.toContain(']]>');
  });

  it('still converts tables to markdown even if an old html option value is encountered', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<p>Before</p><table><tr><th>A</th></tr><tr><td><a href="/wiki/spaces/ENG/pages/7/Checklist">B</a></td></tr></table><p>After</p>',
      assets: []
    }, { tableFormat: 'html' } as never);

    expect(result.markdown).toContain('Before');
    expect(result.markdown).toContain('| A |');
    expect(result.markdown).toContain('https://workspace.atlassian.net/wiki/spaces/ENG/pages/7/Checklist');
    expect(result.markdown).toContain('After');
    expect(result.markdown).not.toContain('<table>');
  });

  it('converts tables to markdown when markdown table export is selected', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<table><tr><th>A</th></tr><tr><td>B</td></tr></table>',
      assets: []
    }, { tableFormat: 'markdown' } as never);

    expect(result.markdown).toContain('| A |');
    expect(result.markdown).toContain('| --- |');
    expect(result.markdown).toContain('| B |');
    expect(result.markdown).not.toContain('<table>');
  });

  it('converts realistic confluence tables to markdown when markdown table export is selected', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<table class="confluenceTable"><tbody><tr><th class="confluenceTh"><p>A</p></th><th class="confluenceTh"><p>C</p></th></tr><tr><td class="confluenceTd"><p>B</p></td><td class="confluenceTd"><p>D</p></td></tr></tbody></table>',
      assets: []
    }, { tableFormat: 'markdown' } as never);

    expect(result.markdown).toContain('| A | C |');
    expect(result.markdown).toContain('| --- | --- |');
    expect(result.markdown).toContain('| B | D |');
    expect(result.markdown).not.toContain('<table>');
  });

  it('strips confluence sorting controls from table headers in markdown mode', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<table data-testid="renderer-table"><tbody><tr><th class="ak-renderer-tableHeader-sortable-column__wrapper"><div class="ak-renderer-tableHeader-sortable-column"><p><span>Header A</span></p><figure class="ak-renderer-tableHeader-sorting-icon__wrapper"><div role="presentation"><div class="ak-renderer-tableHeader-sorting-icon" role="button" tabindex="0" aria-label="Keine Sortierung"></div></div></figure></div></th><th class="ak-renderer-tableHeader-sortable-column__wrapper"><div class="ak-renderer-tableHeader-sortable-column"><p><span>Header B</span></p><figure class="ak-renderer-tableHeader-sorting-icon__wrapper"><div role="presentation"><div class="ak-renderer-tableHeader-sorting-icon" role="button" tabindex="0" aria-label="Keine Sortierung"></div></div></figure></div></th></tr><tr><td><p>Value A</p></td><td><p>Value B</p></td></tr></tbody></table>',
      assets: []
    }, { tableFormat: 'markdown' } as never);

    expect(result.markdown).toContain('| Header A | Header B |');
    expect(result.markdown).toContain('| Value A | Value B |');
    expect(result.markdown).not.toContain('Keine Sortierung');
    expect(result.markdown).not.toContain('<table>');
  });

  it('converts the real exported confluence table shape to markdown without raw html', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Steckbrief E-Rechnung',
      url: 'https://dvag.atlassian.net/wiki/spaces/ITARC/pages/1232470161/Steckbrief+E-Rechnung',
      contentHtml: '<table data-testid="renderer-table" data-number-column="false" data-table-width="1800" data-layout="full-width"><colgroup><col style="width: 127px;"><col style="width: 179px;"><col style="width: 513px;"></colgroup><tbody><tr><th rowspan="1" colspan="1" colorname="" class="ak-renderer-tableHeader-sortable-column__wrapper" data-colwidth="182" aria-sort="Keine"></th><th rowspan="1" colspan="1" colorname="" class="ak-renderer-tableHeader-sortable-column__wrapper" data-colwidth="257" aria-sort="Keine"></th><th rowspan="1" colspan="1" colorname="" class="ak-renderer-tableHeader-sortable-column__wrapper" data-colwidth="733" aria-sort="Keine"></th></tr><tr><th rowspan="1" colspan="1" colorname="" data-colwidth="182">Name</th><td rowspan="1" colspan="1" colorname="" data-colwidth="257"></td><td rowspan="1" colspan="1" colorname="" data-colwidth="733"><em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Wer: Technischer Lead</span></em> <em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Wie: Der Name sollte sowohl mit der Deployment-Einheit als auch mit dem Modul im Produkt und Service Katalog übereinstimmen</span></em> <em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Was: Der Name des Microservices</span></em> <em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Warum:&nbsp;Wird benötigt von</span>&nbsp;<span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">INC, CMN, PMN, SCC</span></em><em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Beispiel:&nbsp;Metrics-Publisher</span></em></td></tr><tr><th rowspan="1" colspan="1" colorname="" data-colwidth="182">Status</th><td rowspan="1" colspan="1" colorname="" data-colwidth="257"></td><td rowspan="1" colspan="1" colorname="" data-colwidth="733"><em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Wer:&nbsp;Technischer Lead</span></em> <em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Wie:&nbsp;</span></em><span data-annotation-inline-node="true" data-annotation-mark="true" data-renderer-start-pos="2099" role="emphasis"><span class="status-lozenge-span" tabindex="-1" data-node-type="status" data-color="red"><span><span>OFFEN</span></span></span></span><em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">&nbsp;</span></em><span data-annotation-inline-node="true" data-annotation-mark="true" data-renderer-start-pos="2101" role="emphasis"><span class="status-lozenge-span" tabindex="-1" data-node-type="status" data-color="yellow"><span><span>IN ARBEIT</span></span></span></span><em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">&nbsp;</span></em><span data-annotation-inline-node="true" data-annotation-mark="true" data-renderer-start-pos="2103" role="emphasis"><span class="status-lozenge-span" tabindex="-1" data-node-type="status" data-color="blue"><span><span>in Review</span></span></span></span><em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">&nbsp;</span></em><span data-annotation-inline-node="true" data-annotation-mark="true" data-renderer-start-pos="2105" role="emphasis"><span class="status-lozenge-span" tabindex="-1" data-node-type="status" data-color="green"><span><span>Fertig</span></span></span></span> <em data-renderer-mark="true"><span data-renderer-mark="true" data-text-custom-color="#ff0000" class="fabric-text-color-mark" style="--custom-palette-color: #ff0000;">Was:&nbsp;Der Status des Steckbriefes</span></em></td></tr></tbody></table>',
      assets: []
    }, { tableFormat: 'markdown' } as never);

    expect(result.markdown).toContain('| Name |');
    expect(result.markdown).toContain('Metrics-Publisher');
    expect(result.markdown).toContain('OFFEN');
    expect(result.markdown).not.toContain('<table');
  });
});
