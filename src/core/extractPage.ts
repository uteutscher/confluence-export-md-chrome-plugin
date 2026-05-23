import type { ExtractedAsset, ExtractedPage } from './types';

const COMMENT_SELECTORS = ['[data-testid="inline-comment-marker"]', '[data-testid="comment"]'];

export function extractPage(document: Document, pageUrl: string): ExtractedPage {
  const contentRoot = document.querySelector('main[data-testid="page-content"]');
  if (contentRoot === null) {
    throw new Error('Could not find the Confluence page content.');
  }

  const clonedRoot = contentRoot.cloneNode(true) as HTMLElement;
  COMMENT_SELECTORS.forEach((selector) => {
    clonedRoot.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const heading = clonedRoot.querySelector('h1');
  const title = heading?.textContent?.trim() || document.title.trim();
  heading?.remove();

  const assets: ExtractedAsset[] = Array.from(clonedRoot.querySelectorAll('a[href]'))
    .map((link) => {
      const href = link.getAttribute('href');
      if (href === null) {
        return null;
      }

      const absoluteUrl = new URL(href, pageUrl).toString();
      const label = link.textContent?.trim() || absoluteUrl;

      if (absoluteUrl.includes('/download/attachments/')) {
        return { type: 'attachment' as const, label, url: absoluteUrl };
      }

      return null;
    })
    .filter((asset): asset is ExtractedAsset => asset !== null);

  // Fix: convert all relative links to absolute in contentHtml
  Array.from(clonedRoot.querySelectorAll('a[href]')).forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      link.setAttribute('href', new URL(href, pageUrl).toString());
    }
  });

  // Remove extra whitespace between elements in contentHtml
  const contentHtml = clonedRoot.innerHTML.replace(/\s*(<[^>]+>)\s*/g, '$1').trim();

  return {
    title,
    url: pageUrl,
    contentHtml,
    assets
  };
}
