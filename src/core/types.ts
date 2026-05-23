export interface ExportWarning {
  code: string;
  message: string;
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
