export type PageEligibility =
  | { ok: true }
  | { ok: false; reason: string };

export function getPageEligibility(url: URL): PageEligibility {
  if (url.hostname.endsWith('.atlassian.net') === false || url.pathname.startsWith('/wiki/') === false) {
    return { ok: false, reason: 'This tab is not a Confluence Cloud page.' };
  }

  const pagePattern = /^\/wiki\/spaces\/[^/]+\/pages\/\d+\/.+$/;
  if (pagePattern.test(url.pathname) === false) {
    return { ok: false, reason: 'This Confluence view is not a regular page.' };
  }

  return { ok: true };
}
