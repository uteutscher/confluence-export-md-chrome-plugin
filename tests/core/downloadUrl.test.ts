import { describe, expect, it } from 'vitest';
import { createMarkdownDownloadUrl } from '../../src/core/downloadUrl';

describe('createMarkdownDownloadUrl', () => {
  it('creates a markdown data url for download-safe text', () => {
    expect(createMarkdownDownloadUrl('# Überprüfung\n\n- Eins')).toBe(
      'data:text/markdown;charset=utf-8,%23%20%C3%9Cberpr%C3%BCfung%0A%0A-%20Eins'
    );
  });
});
