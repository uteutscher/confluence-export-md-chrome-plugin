import type { ExtractedAsset, ExtractedPage } from './types';

const COMMENT_SELECTORS = ['[data-testid="inline-comment-marker"]', '[data-testid="comment"]'];
const CONTENT_SELECTORS = ['main[data-testid="page-content"]', '[data-testid="pageContentRendererTestId"]', '#main-content'];
const TITLE_SELECTORS = ['#content-title-id h1', '#heading-title-text'];

function isElement(element: Element | null | undefined): element is Element {
  return element !== null && element !== undefined;
}

export function extractPage(document: Document, pageUrl: string): ExtractedPage {
  const contentRoot = CONTENT_SELECTORS
    .map((selector) => document.querySelector(selector))
    .find(isElement) ?? null;

  if (contentRoot === null) {
    throw new Error('Could not find the Confluence page content.');
  }

  const clonedRoot = contentRoot.cloneNode(true) as HTMLElement;
  COMMENT_SELECTORS.forEach((selector) => {
    clonedRoot.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const titleElement = TITLE_SELECTORS
    .map((selector) => document.querySelector(selector))
    .find(isElement);
  const heading = clonedRoot.querySelector('h1');
  const title = titleElement?.textContent?.trim() || heading?.textContent?.trim() || document.title.trim();
  if (titleElement === undefined) {
    heading?.remove();
  }

  const assets = Array.from(clonedRoot.querySelectorAll('a[href]'))
    .map((link) => {
      const href = link.getAttribute('href');
      if (href === null) {
        return null;
      }

      const absoluteUrl = new URL(href, pageUrl).toString();
      const label = link.textContent?.trim() || absoluteUrl;

      if (absoluteUrl.includes('/download/attachments/')) {
        return { type: 'attachment' as const, label, url: absoluteUrl } satisfies ExtractedAsset;
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
