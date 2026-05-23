import { convertExtractedPageToMarkdown } from '../core/convertMarkdown';
import { extractPage } from '../core/extractPage';
import type { ExportOptions } from '../core/types';

export function exportCurrentPage(
  document: Document,
  pageUrl: string,
  options: ExportOptions = { tableFormat: 'markdown' }
) {
  const extractedPage = extractPage(document, pageUrl);
  return convertExtractedPageToMarkdown(extractedPage, options);
}
