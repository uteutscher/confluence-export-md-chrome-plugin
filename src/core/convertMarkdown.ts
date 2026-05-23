import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ExtractedPage, MarkdownConversionResult } from './types';

function normalizeRelativeLinks(html: string, pageUrl: string): string {
  return html.replace(/href="([^"]+)"/g, (_match, href: string) => {
    return `href="${new URL(href, pageUrl).toString()}"`;
  });
}

function createTurndownService(warnings: MarkdownConversionResult['warnings']): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  service.use(gfm);

  service.addRule('panel', {
    filter: (node) => node instanceof HTMLElement && node.hasAttribute('data-panel-type'),
    replacement: (content, node) => {
      const label = (node as HTMLElement).getAttribute('data-panel-type') || 'info';
      return `\n> **${label[0].toUpperCase()}${label.slice(1)}:** ${content.trim()}\n`;
    }
  });

  service.addRule('status', {
    filter: (node) => node instanceof HTMLElement && node.getAttribute('data-testid') === 'status-lozenge',
    replacement: (_content, node) => `[Status: ${(node as HTMLElement).textContent?.trim() || ''}]`
  });

  service.addRule('task-list', {
    filter: (node) => node instanceof HTMLLIElement && node.parentElement?.getAttribute('data-task-list') === 'true',
    replacement: (_content, node) => {
      const checkbox = node.querySelector('input[type="checkbox"]');
      const checked = checkbox instanceof HTMLInputElement && checkbox.checked;
      const text = Array.from(node.childNodes)
        .filter((child) => child.nodeName !== 'INPUT')
        .map((child) => child.textContent || '')
        .join('')
        .trim();
      return `\n- [${checked ? 'x' : ' '}] ${text}`;
    }
  });

  service.addRule('unsupported-macro', {
    filter: (node) => node instanceof HTMLElement && node.hasAttribute('data-macro-name'),
    replacement: (_content, node) => {
      const macroName = (node as HTMLElement).getAttribute('data-macro-name') || 'unknown';
      warnings.push({
        code: 'unsupported-macro',
        message: `Unsupported macro converted to placeholder: ${macroName}`
      });
      return `\n[Unsupported macro: ${macroName}]\n`;
    }
  });

  return service;
}

export function convertExtractedPageToMarkdown(page: ExtractedPage): MarkdownConversionResult {
  const warnings: MarkdownConversionResult['warnings'] = [];
  const turndown = createTurndownService(warnings);
  const normalizedHtml = normalizeRelativeLinks(page.contentHtml, page.url);
  const body = turndown.turndown(normalizedHtml).trim();

  return {
    markdown: `# ${page.title}\n\n${body}`.trim(),
    warnings
  };
}
