# Confluence Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome Manifest V3 extension that exports the active Confluence Cloud page to a GitHub Flavored Markdown file with clear success, warning, and error feedback.

**Architecture:** Keep the extension shell thin and push risky logic into small shared modules. The popup and service worker only orchestrate eligibility, export, and download; the content script runs extraction and conversion using focused core modules for page detection, filename generation, extraction, and Markdown conversion.

**Tech Stack:** TypeScript, Vite, Vitest, jsdom, Chrome Extension Manifest V3, Turndown, turndown-plugin-gfm

---

## File Structure

- Create: `package.json` — npm scripts and dependency manifest
- Create: `tsconfig.json` — TypeScript compiler settings for app and tests
- Create: `vite.config.ts` — fixed-file-name Vite build for popup, service worker, and content script
- Create: `public/manifest.json` — Chrome extension manifest
- Create: `popup.html` — popup entry HTML
- Create: `src/core/types.ts` — shared serializable domain types
- Create: `src/core/filename.ts` — title-to-filename normalization
- Create: `src/core/pageEligibility.ts` — Confluence Cloud page support detection
- Create: `src/core/extractPage.ts` — DOM extraction from Confluence page into serializable data
- Create: `src/core/convertMarkdown.ts` — Turndown-based Markdown conversion plus warnings
- Create: `src/content/exportCurrentPage.ts` — content-script orchestration of extraction + conversion
- Create: `src/content/main.ts` — message listener for export requests
- Create: `src/background/main.ts` — active-tab checks, message passing, download orchestration
- Create: `src/popup/app.ts` — render popup states and wire button behavior
- Create: `src/popup/main.ts` — popup bootstrap
- Create: `src/popup/styles.css` — minimal popup styling
- Test: `tests/core/filename.test.ts`
- Test: `tests/core/pageEligibility.test.ts`
- Test: `tests/core/extractPage.test.ts`
- Test: `tests/core/convertMarkdown.test.ts`
- Test: `tests/content/exportCurrentPage.test.ts`
- Test: `tests/popup/app.test.ts`

### Task 1: Scaffold the extension workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `public/manifest.json`
- Create: `popup.html`

- [ ] **Step 1: Initialize the repository and install dependencies**

Run:

```bash
git init
npm init -y
npm install turndown turndown-plugin-gfm
npm install -D @types/chrome jsdom typescript vite vitest
```

Expected: npm installs complete with no missing-package errors.

- [ ] **Step 2: Replace `package.json` with working scripts**

```json
{
  "name": "confluence-export-md-chrome-plugin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "turndown": "^7.2.0",
    "turndown-plugin-gfm": "^1.0.2"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 3: Add compiler, build, and manifest config**

`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noEmit": true,
    "types": ["chrome", "vitest/globals"],
    "allowSyntheticDefaultImports": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

`vite.config.ts`

```ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/main.ts'),
        content: resolve(__dirname, 'src/content/main.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js';
          if (chunk.name === 'content') return 'content.js';
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  test: {
    environment: 'jsdom'
  }
});
```

`public/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Confluence Export to Markdown",
  "version": "0.1.0",
  "description": "Export the active Confluence Cloud page to Markdown.",
  "permissions": ["activeTab", "downloads", "scripting", "tabs"],
  "host_permissions": ["https://*.atlassian.net/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Export Markdown"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://*.atlassian.net/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

`popup.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confluence Export</title>
    <script type="module" src="/src/popup/main.ts"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

- [ ] **Step 4: Run the empty test suite once**

Run:

```bash
npm test
```

Expected: Vitest starts successfully and reports no test files found, proving the toolchain is wired before feature work starts.

- [ ] **Step 5: Commit the scaffold**

```bash
git add package.json tsconfig.json vite.config.ts public/manifest.json popup.html
git commit -m "chore: scaffold chrome extension workspace"
```

### Task 2: Build filename normalization with TDD

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/filename.ts`
- Test: `tests/core/filename.test.ts`

- [ ] **Step 1: Write the failing filename tests**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/core/filename.test.ts
```

Expected: FAIL because `src/core/filename.ts` does not exist yet.

- [ ] **Step 3: Write the minimal shared types and filename implementation**

`src/core/types.ts`

```ts
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
```

`src/core/filename.ts`

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/core/filename.test.ts
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts src/core/filename.ts tests/core/filename.test.ts
git commit -m "feat: add filename normalization"
```

### Task 3: Detect supported Confluence Cloud pages with TDD

**Files:**
- Create: `src/core/pageEligibility.ts`
- Test: `tests/core/pageEligibility.test.ts`

- [ ] **Step 1: Write the failing page-eligibility tests**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/core/pageEligibility.test.ts
```

Expected: FAIL because `getPageEligibility` is not defined yet.

- [ ] **Step 3: Write the minimal page-eligibility implementation**

`src/core/pageEligibility.ts`

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/core/pageEligibility.test.ts
```

Expected: PASS with 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/pageEligibility.ts tests/core/pageEligibility.test.ts
git commit -m "feat: detect supported confluence pages"
```

### Task 4: Extract the Confluence page body with TDD

**Files:**
- Create: `src/core/extractPage.ts`
- Test: `tests/core/extractPage.test.ts`

- [ ] **Step 1: Write the failing extraction tests**

```ts
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractPage } from '../../src/core/extractPage';

describe('extractPage', () => {
  it('extracts title, content html, and attachments while excluding comments ui', () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <main data-testid="page-content">
            <h1>Runbook</h1>
            <p>Deploy safely.</p>
            <a href="/wiki/download/attachments/12/checklist.pdf">checklist.pdf</a>
          </main>
          <div data-testid="inline-comment-marker">comment badge</div>
        </body>
      </html>
    `, { url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook' });

    expect(extractPage(dom.window.document, dom.window.location.href)).toEqual({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: '<p>Deploy safely.</p><a href="https://workspace.atlassian.net/wiki/download/attachments/12/checklist.pdf">checklist.pdf</a>',
      assets: [
        {
          type: 'attachment',
          label: 'checklist.pdf',
          url: 'https://workspace.atlassian.net/wiki/download/attachments/12/checklist.pdf'
        }
      ]
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/core/extractPage.test.ts
```

Expected: FAIL because `src/core/extractPage.ts` does not exist yet.

- [ ] **Step 3: Write the minimal extraction implementation**

`src/core/extractPage.ts`

```ts
import type { ExtractedAsset, ExtractedPage } from './types';

const COMMENT_SELECTORS = ['[data-testid="inline-comment-marker"]', '[data-testid="comment"]'];

export function extractPage(document: Document, pageUrl: string): ExtractedPage {
  const contentRoot = document.querySelector('main[data-testid="page-content"]');
  if (contentRoot === null) {
    throw new Error('Could not find the Confluence page content.');
  }

  const clonedRoot = contentRoot.cloneNode(true) as HTMLElement;
  COMMENT_SELECTORS.forEach((selector) => {
    clonedRoot.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const heading = clonedRoot.querySelector('h1');
  const title = heading?.textContent?.trim() || document.title.trim();
  heading?.remove();

  const assets: ExtractedAsset[] = Array.from(clonedRoot.querySelectorAll('a[href]'))
    .map((link) => {
      const href = link.getAttribute('href');
      if (href === null) {
        return null;
      }

      const absoluteUrl = new URL(href, pageUrl).toString();
      const label = link.textContent?.trim() || absoluteUrl;

      if (absoluteUrl.includes('/download/attachments/')) {
        return { type: 'attachment' as const, label, url: absoluteUrl };
      }

      return null;
    })
    .filter((asset): asset is ExtractedAsset => asset !== null);

  return {
    title,
    url: pageUrl,
    contentHtml: clonedRoot.innerHTML.trim(),
    assets
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/core/extractPage.test.ts
```

Expected: PASS with 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/extractPage.ts tests/core/extractPage.test.ts
git commit -m "feat: extract confluence page content"
```

### Task 5: Convert standard page content to Markdown with TDD

**Files:**
- Create: `src/core/convertMarkdown.ts`
- Test: `tests/core/convertMarkdown.test.ts`

- [ ] **Step 1: Write the failing Markdown conversion tests**

```ts
import { describe, expect, it } from 'vitest';
import { convertExtractedPageToMarkdown } from '../../src/core/convertMarkdown';

describe('convertExtractedPageToMarkdown', () => {
  it('converts standard html structures to gfm and prepends the title', () => {
    const result = convertExtractedPageToMarkdown({
      title: 'Runbook',
      url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
      contentHtml: `
        <h2>Deploy</h2>
        <p>Open the <a href="/wiki/spaces/ENG/pages/7/Checklist">checklist</a>.</p>
        <pre><code class="language-bash">echo hello</code></pre>
      `,
      assets: []
    });

    expect(result).toEqual({
      markdown: '# Runbook\n\n## Deploy\n\nOpen the [checklist](https://workspace.atlassian.net/wiki/spaces/ENG/pages/7/Checklist).\n\n```bash\necho hello\n```',
      warnings: []
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts
```

Expected: FAIL because the converter does not exist yet.

- [ ] **Step 3: Write the minimal Turndown-based converter**

`src/core/convertMarkdown.ts`

```ts
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ExtractedPage, MarkdownConversionResult } from './types';

function normalizeRelativeLinks(html: string, pageUrl: string): string {
  return html.replace(/href="([^"]+)"/g, (_match, href: string) => {
    return `href="${new URL(href, pageUrl).toString()}"`;
  });
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  service.use(gfm);
  return service;
}

export function convertExtractedPageToMarkdown(page: ExtractedPage): MarkdownConversionResult {
  const turndown = createTurndownService();
  const normalizedHtml = normalizeRelativeLinks(page.contentHtml, page.url);
  const body = turndown.turndown(normalizedHtml).trim();

  return {
    markdown: `# ${page.title}\n\n${body}`.trim(),
    warnings: []
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts
```

Expected: PASS with 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/convertMarkdown.ts tests/core/convertMarkdown.test.ts
git commit -m "feat: convert standard content to markdown"
```

### Task 6: Add Confluence-specific rules and warnings with TDD

**Files:**
- Modify: `src/core/convertMarkdown.ts`
- Test: `tests/core/convertMarkdown.test.ts`

- [ ] **Step 1: Extend the failing converter tests for panels, status, tasks, and unsupported macros**

```ts
it('converts panels, task lists, and unsupported macros into readable markdown with warnings', () => {
  const result = convertExtractedPageToMarkdown({
    title: 'Runbook',
    url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook',
    contentHtml: `
      <div data-panel-type="warning"><p>Rotate credentials.</p></div>
      <span data-testid="status-lozenge">In Progress</span>
      <ul data-task-list="true"><li><input type="checkbox" checked />Done</li><li><input type="checkbox" />Next</li></ul>
      <div data-macro-name="roadmap">Roadmap macro</div>
    `,
    assets: []
  });

  expect(result.markdown).toContain('> **Warning:** Rotate credentials.');
  expect(result.markdown).toContain('[Status: In Progress]');
  expect(result.markdown).toContain('- [x] Done');
  expect(result.markdown).toContain('- [ ] Next');
  expect(result.markdown).toContain('[Unsupported macro: roadmap]');
  expect(result.warnings).toEqual([
    { code: 'unsupported-macro', message: 'Unsupported macro converted to placeholder: roadmap' }
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts
```

Expected: FAIL because the current Turndown rules do not handle Confluence-specific markup.

- [ ] **Step 3: Add custom rules and warning collection**

Update `src/core/convertMarkdown.ts`:

```ts
function createTurndownService(warnings: MarkdownConversionResult['warnings']): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  service.use(gfm);

  service.addRule('panel', {
    filter: (node) => node instanceof HTMLElement && node.hasAttribute('data-panel-type'),
    replacement: (content, node) => {
      const label = (node as HTMLElement).getAttribute('data-panel-type') || 'info';
      return `\n> **${label[0].toUpperCase()}${label.slice(1)}:** ${content.trim()}\n`;
    }
  });

  service.addRule('status', {
    filter: (node) => node instanceof HTMLElement && node.getAttribute('data-testid') === 'status-lozenge',
    replacement: (_content, node) => `[Status: ${(node as HTMLElement).textContent?.trim() || ''}]`
  });

  service.addRule('task-list', {
    filter: (node) => node instanceof HTMLLIElement && node.parentElement?.getAttribute('data-task-list') === 'true',
    replacement: (_content, node) => {
      const checkbox = node.querySelector('input[type="checkbox"]');
      const checked = checkbox instanceof HTMLInputElement && checkbox.checked;
      const text = Array.from(node.childNodes)
        .filter((child) => child.nodeName !== 'INPUT')
        .map((child) => child.textContent || '')
        .join('')
        .trim();
      return `\n- [${checked ? 'x' : ' '}] ${text}`;
    }
  });

  service.addRule('unsupported-macro', {
    filter: (node) => node instanceof HTMLElement && node.hasAttribute('data-macro-name'),
    replacement: (_content, node) => {
      const macroName = (node as HTMLElement).getAttribute('data-macro-name') || 'unknown';
      warnings.push({
        code: 'unsupported-macro',
        message: `Unsupported macro converted to placeholder: ${macroName}`
      });
      return `\n[Unsupported macro: ${macroName}]\n`;
    }
  });

  return service;
}

export function convertExtractedPageToMarkdown(page: ExtractedPage): MarkdownConversionResult {
  const warnings: MarkdownConversionResult['warnings'] = [];
  const turndown = createTurndownService(warnings);
  const normalizedHtml = normalizeRelativeLinks(page.contentHtml, page.url);
  const body = turndown.turndown(normalizedHtml).trim();

  return {
    markdown: `# ${page.title}\n\n${body}`.trim(),
    warnings
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts
```

Expected: PASS with both converter tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/convertMarkdown.ts tests/core/convertMarkdown.test.ts
git commit -m "feat: handle confluence-specific markdown rules"
```

### Task 7: Wire the content script export flow with TDD

**Files:**
- Create: `src/content/exportCurrentPage.ts`
- Create: `src/content/main.ts`
- Test: `tests/content/exportCurrentPage.test.ts`

- [ ] **Step 1: Write the failing content export test**

```ts
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { exportCurrentPage } from '../../src/content/exportCurrentPage';

describe('exportCurrentPage', () => {
  it('returns markdown and warnings for the current document', () => {
    const dom = new JSDOM(`
      <main data-testid="page-content">
        <h1>Runbook</h1>
        <div data-panel-type="warning"><p>Rotate credentials.</p></div>
      </main>
    `, { url: 'https://workspace.atlassian.net/wiki/spaces/ENG/pages/12345/Runbook' });

    expect(exportCurrentPage(dom.window.document, dom.window.location.href)).toEqual({
      markdown: '# Runbook\n\n> **Warning:** Rotate credentials.',
      warnings: []
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/content/exportCurrentPage.test.ts
```

Expected: FAIL because the orchestration module does not exist yet.

- [ ] **Step 3: Write the minimal content-script orchestration**

`src/content/exportCurrentPage.ts`

```ts
import { convertExtractedPageToMarkdown } from '../core/convertMarkdown';
import { extractPage } from '../core/extractPage';

export function exportCurrentPage(document: Document, pageUrl: string) {
  const extractedPage = extractPage(document, pageUrl);
  return convertExtractedPageToMarkdown(extractedPage);
}
```

`src/content/main.ts`

```ts
import { exportCurrentPage } from './exportCurrentPage';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'export-current-page') {
    return;
  }

  try {
    sendResponse({
      ok: true,
      payload: exportCurrentPage(document, window.location.href)
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unexpected export error.';
    sendResponse({ ok: false, error: messageText });
  }
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/content/exportCurrentPage.test.ts
```

Expected: PASS with 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add src/content/exportCurrentPage.ts src/content/main.ts tests/content/exportCurrentPage.test.ts
git commit -m "feat: export the current confluence page from content script"
```

### Task 8: Add popup and background orchestration with TDD

**Files:**
- Create: `src/background/main.ts`
- Create: `src/popup/app.ts`
- Create: `src/popup/main.ts`
- Create: `src/popup/styles.css`
- Test: `tests/popup/app.test.ts`

- [ ] **Step 1: Write the failing popup rendering test**

```ts
import { describe, expect, it } from 'vitest';
import { renderPopup } from '../../src/popup/app';

describe('renderPopup', () => {
  it('shows a disabled button and explanation for unsupported pages', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderPopup(document.querySelector('#app') as HTMLElement, {
      kind: 'unsupported',
      message: 'This tab is not a Confluence Cloud page.'
    });

    expect(document.body.textContent).toContain('This tab is not a Confluence Cloud page.');
    expect(document.querySelector('button')?.hasAttribute('disabled')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/popup/app.test.ts
```

Expected: FAIL because popup code does not exist yet.

- [ ] **Step 3: Write the popup renderer and service-worker orchestration**

`src/popup/app.ts`

```ts
export type PopupState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'unsupported'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function renderPopup(root: HTMLElement, state: PopupState): void {
  if (state.kind === 'loading') {
    root.innerHTML = '<p>Checking page…</p>';
    return;
  }

  if (state.kind === 'unsupported') {
    root.innerHTML = `<p>${state.message}</p><button disabled>Export Markdown</button>`;
    return;
  }

  if (state.kind === 'ready') {
    root.innerHTML = '<button id="export-button">Export Markdown</button><p id="status"></p>';
    return;
  }

  root.innerHTML = `<p>${state.message}</p><button id="export-button">Export Markdown</button>`;
}
```

`src/background/main.ts`

```ts
import { createMarkdownFileName } from '../core/filename';
import { getPageEligibility } from '../core/pageEligibility';

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error('Could not determine the active tab.');
  }
  return tab;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message?.type === 'get-popup-state') {
        const tab = await getActiveTab();
        const eligibility = getPageEligibility(new URL(tab.url));
        sendResponse(
          eligibility.ok
            ? { ok: true, state: { kind: 'ready' } }
            : { ok: true, state: { kind: 'unsupported', message: eligibility.reason } }
        );
        return;
      }

      if (message?.type === 'start-export') {
        const tab = await getActiveTab();
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'export-current-page' });
        if (response.ok !== true) {
          throw new Error(response.error || 'Export failed.');
        }

        const fileName = createMarkdownFileName(response.payload.markdown.split('\n')[0].replace(/^# /, ''));
        const url = URL.createObjectURL(new Blob([response.payload.markdown], { type: 'text/markdown' }));

        await chrome.downloads.download({ url, filename: fileName, saveAs: false });
        sendResponse({
          ok: true,
          state: {
            kind: 'success',
            message:
              response.payload.warnings.length > 0
                ? `Export complete with ${response.payload.warnings.length} warning(s).`
                : 'Export complete.'
          }
        });
      }
    } catch (error) {
      sendResponse({
        ok: false,
        state: {
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unexpected export error.'
        }
      });
    }
  })();

  return true;
});
```

`src/popup/main.ts`

```ts
import './styles.css';
import { renderPopup, type PopupState } from './app';

const root = document.querySelector('#app') as HTMLElement;
renderPopup(root, { kind: 'loading' });

chrome.runtime.sendMessage({ type: 'get-popup-state' }, (response: { ok: boolean; state: PopupState }) => {
  renderPopup(root, response.state);

  const button = document.querySelector<HTMLButtonElement>('#export-button');
  if (button === null || response.state.kind !== 'ready') {
    return;
  }

  button.addEventListener('click', () => {
    renderPopup(root, { kind: 'loading' });
    chrome.runtime.sendMessage({ type: 'start-export' }, (exportResponse: { ok: boolean; state: PopupState }) => {
      renderPopup(root, exportResponse.state);
    });
  });
});
```

`src/popup/styles.css`

```css
body {
  margin: 0;
  min-width: 320px;
  font-family: Arial, sans-serif;
}

#app {
  padding: 16px;
}

button {
  width: 100%;
  padding: 10px 12px;
}
```

- [ ] **Step 4: Run the popup test to verify it passes**

Run:

```bash
npx vitest run tests/popup/app.test.ts
```

Expected: PASS with 1 test passed.

- [ ] **Step 5: Commit**

```bash
git add src/background/main.ts src/popup/app.ts src/popup/main.ts src/popup/styles.css tests/popup/app.test.ts
git commit -m "feat: add popup and background export flow"
```

### Task 9: Run full verification and produce a loadable build

**Files:**
- Modify: `src/background/main.ts`
- Modify: `src/content/main.ts`
- Modify: `src/popup/main.ts`
- Test: `tests/core/filename.test.ts`
- Test: `tests/core/pageEligibility.test.ts`
- Test: `tests/core/extractPage.test.ts`
- Test: `tests/core/convertMarkdown.test.ts`
- Test: `tests/content/exportCurrentPage.test.ts`
- Test: `tests/popup/app.test.ts`

- [ ] **Step 1: Tighten message shapes before final verification**

Update `src/content/main.ts` to return a strict payload shape:

```ts
type ExportMessageResponse =
  | { ok: true; payload: { markdown: string; warnings: { code: string; message: string }[] } }
  | { ok: false; error: string };
```

Update `src/background/main.ts` to read the payload from that exact shape and never assume success without `ok === true`.

Update `src/popup/main.ts` to treat missing responses as fatal errors:

```ts
if (!exportResponse || exportResponse.ok !== true) {
  renderPopup(root, {
    kind: 'error',
    message: exportResponse?.state?.message || 'The export did not return a valid response.'
  });
  return;
}
```

- [ ] **Step 2: Run the entire test suite**

Run:

```bash
npm test
```

Expected: PASS with all core, content, and popup tests green.

- [ ] **Step 3: Build the extension bundle**

Run:

```bash
npm run build
```

Expected: PASS and create `dist/popup.html`, `dist/background.js`, `dist/content.js`, and copied manifest assets.

- [ ] **Step 4: Load the extension in Chrome and do one manual smoke test**

Run manually in Chrome:

```text
1. Open chrome://extensions
2. Enable Developer mode
3. Load unpacked -> choose the dist/ directory
4. Open a supported Confluence Cloud page
5. Open the extension popup and click "Export Markdown"
6. Confirm a .md file downloads and popup reports success or success with warnings
```

Expected: one file download, readable Markdown, and no silent failure.

- [ ] **Step 5: Commit**

```bash
git add src/background/main.ts src/content/main.ts src/popup/main.ts
git commit -m "feat: ship first confluence markdown export mvp"
```
