import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { type ExportOptions, type ExtractedPage, type MarkdownConversionResult } from './types';

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

function hasAttribute(node: Node, attributeName: string): node is Element {
  return isElement(node) && node.hasAttribute(attributeName);
}

function normalizeRelativeLinks(html: string, pageUrl: string): string {
  return html.replace(/href="([^"]+)"/g, (_match, href: string) => {
    return `href="${new URL(href, pageUrl).toString()}"`;
  });
}

function preserveTablesAsHtml(html: string): { html: string; tables: Array<{ token: string; html: string }> } {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');
  const tables: Array<{ token: string; html: string }> = [];

  parsed.querySelectorAll('table').forEach((table, index) => {
    const token = `CONFLUENCETABLETOKEN${index}XYZ`;
    tables.push({ token, html: table.outerHTML });
    table.replaceWith(parsed.createTextNode(token));
  });

  return { html: parsed.body.innerHTML, tables };
}

function restorePreservedTables(markdown: string, tables: Array<{ token: string; html: string }>): string {
  return tables.reduce(
    (output, table) => output.replaceAll(table.token, `\n\n${table.html}\n\n`),
    markdown
  );
}

function createTurndownService(warnings: MarkdownConversionResult['warnings']): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  service.use(gfm);

  service.addRule('panel', {
    filter: (node) => hasAttribute(node, 'data-panel-type'),
    replacement: (content, node) => {
      const label = (node as HTMLElement).getAttribute('data-panel-type')?.trim() || 'info';
      return `\n> **${label[0].toUpperCase()}${label.slice(1)}:** ${content.trim()}\n`;
    }
  });

  service.addRule('status', {
    filter: (node) => isElement(node) && node.getAttribute('data-testid') === 'status-lozenge',
    replacement: (_content, node) => `[Status: ${(node as HTMLElement).textContent?.trim() || ''}]`
  });

  service.addRule('task-list', {
    filter: (node) => isElement(node) && node.tagName === 'LI' && node.parentElement?.getAttribute('data-task-list') === 'true',
    replacement: (_content, node) => {
      const checkbox = node.querySelector('input[type="checkbox"]');
      const checked = isElement(checkbox) && checkbox.tagName === 'INPUT' && 'checked' in checkbox && Boolean(checkbox.checked);
      const text = Array.from(node.childNodes)
        .filter((child) => child.nodeName !== 'INPUT')
        .map((child) => child.textContent || '')
        .join('')
        .trim();
      return `\n- [${checked ? 'x' : ' '}] ${text}`;
    }
  });

  service.addRule('unsupported-macro', {
    filter: (node) => hasAttribute(node, 'data-macro-name'),
    replacement: () => ''
  });

  return service;
}

export function convertExtractedPageToMarkdown(
  page: ExtractedPage,
  options: ExportOptions = { tableFormat: 'markdown' }
): MarkdownConversionResult {
  const warnings: MarkdownConversionResult['warnings'] = [];
  const normalizedHtml = normalizeRelativeLinks(page.contentHtml, page.url);
  const htmlInput = options.tableFormat === 'html' ? preserveTablesAsHtml(normalizedHtml) : { html: normalizedHtml, tables: [] };
  const turndown = createTurndownService(warnings);
  const body = restorePreservedTables(turndown.turndown(htmlInput.html), htmlInput.tables).trim();

  return {
    markdown: `# ${page.title}\n\n${body}`.trim(),
    warnings
  };
}
