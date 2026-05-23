import { describe, expect, it } from 'vitest';
import { getPageEligibility } from '../../src/core/pageEligibility';

describe('getPageEligibility', () => {
  it('accepts a Confluence Cloud page URL', () => {
    const url = new URL('https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook');
    expect(getPageEligibility(url)).toEqual({ ok: true });
  });

  it('rejects a non-atlassian URL', () => {
    const url = new URL('https://example.com/docs/page');
    expect(getPageEligibility(url)).toEqual({
      ok: false,
      reason: 'This tab is not a Confluence Cloud page.'
    });
  });

  it('rejects non-page Confluence paths', () => {
    const url = new URL('https://workspace.atlassian.net/wiki/home');
    expect(getPageEligibility(url)).toEqual({
      ok: false,
      reason: 'This Confluence view is not a regular page.'
    });
  });
});