const INVALID_FILE_NAME_CHARACTERS = /[<>:"/\\|?*\u0000-\u001F]/g;
const MULTIPLE_SPACES = /\s+/g;

export function createMarkdownFileName(title: string): string {
  const cleaned = title
    .trim()
    .replace(INVALID_FILE_NAME_CHARACTERS, ' - ')
    .replace(MULTIPLE_SPACES, ' ')
    .replace(/\s-\s-\s/g, ' - ')
    .trim();

  const safeTitle = cleaned.length > 0 ? cleaned : 'confluence-export';
  return `${safeTitle}.md`;
}
