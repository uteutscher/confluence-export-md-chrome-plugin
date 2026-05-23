export interface ExportWarning {
  code: string;
  message: string;
}

export type TableFormat = 'markdown' | 'html';

export interface ExportOptions {
  tableFormat: TableFormat;
}

export interface ExtractedAsset {
  type: 'image' | 'attachment';
  label: string;
  url: string;
}

export interface ExtractedPage {
  title: string;
  url: string;
  contentHtml: string;
  assets: ExtractedAsset[];
}

export interface MarkdownConversionResult {
  markdown: string;
  warnings: ExportWarning[];
}

export function isTableFormat(value: unknown): value is TableFormat {
  return value === 'markdown' || value === 'html';
}
