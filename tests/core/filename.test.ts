import { describe, expect, it } from 'vitest';
import { createMarkdownFileName } from '../../src/core/filename';

describe('createMarkdownFileName', () => {
  it('replaces invalid separators and appends md', () => {
    expect(createMarkdownFileName('Projektplan / Q3 2026')).toBe('Projektplan - Q3 2026.md');
  });

  it('keeps unicode characters while trimming whitespace', () => {
    expect(createMarkdownFileName('  Überprüfung ✓  ')).toBe('Überprüfung ✓.md');
  });
});
