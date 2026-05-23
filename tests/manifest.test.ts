import { describe, expect, it } from 'vitest';
import manifest from '../public/manifest.json';

describe('extension manifest', () => {
  it('does not request storage permission when table export is markdown-only', () => {
    expect(manifest.permissions).not.toContain('storage');
  });
});
