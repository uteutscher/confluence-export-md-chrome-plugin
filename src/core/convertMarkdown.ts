import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ExtractedPage, MarkdownConversionResult } from './types';

function normalizeRelativeLinks(html: string, pageUrl: string): string {
  return html.replace(/href="([^"]+)"/g, (_match, href: string) => {
    return `href="${new URL(href, pageUrl).toString()}"`;
  });
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  service.use(gfm);
  return service;
}

export function convertExtractedPageToMarkdown(page: ExtractedPage): MarkdownConversionResult {
  const turndown = createTurndownService();
  const normalizedHtml = normalizeRelativeLinks(page.contentHtml, page.url);
  const body = turndown.turndown(normalizedHtml).trim();

  return {
    markdown: `# ${page.title}\n\n${body}`.trim(),
    warnings: []
  };
}
