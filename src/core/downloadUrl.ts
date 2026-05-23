export function createMarkdownDownloadUrl(markdown: string): string {
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
}
