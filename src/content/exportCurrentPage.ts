import { convertExtractedPageToMarkdown } from '../core/convertMarkdown';
import { extractPage } from '../core/extractPage';

export function exportCurrentPage(document: Document, pageUrl: string) {
  const extractedPage = extractPage(document, pageUrl);
  return convertExtractedPageToMarkdown(extractedPage);
}
