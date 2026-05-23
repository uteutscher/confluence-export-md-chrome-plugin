# Table Format Option Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent popup option that lets the user export Confluence tables either as Markdown tables or as preserved raw HTML tables.

**Architecture:** Extend the existing export flow with one serializable option, `tableFormat`, loaded and persisted in the popup via `chrome.storage.local`, passed through the background/content message flow, and consumed by the Markdown converter. Keep the UI change small and leave success/error handling unchanged.

**Tech Stack:** TypeScript, Vite, Vitest, jsdom, Chrome Extension Manifest V3, Turndown, turndown-plugin-gfm

---

## File Structure

- Modify: `src/core/types.ts` — shared `TableFormat` and export option types
- Modify: `src/core/convertMarkdown.ts` — table-mode aware conversion
- Modify: `src/content/exportCurrentPage.ts` — pass export options into conversion
- Modify: `src/content/main.ts` — accept `tableFormat` in export messages
- Modify: `src/background/main.ts` — read saved setting and forward chosen option
- Modify: `src/popup/app.ts` — render selector in ready state
- Modify: `src/popup/main.ts` — load, save, and submit `tableFormat`
- Modify: `README.md` — describe the new option
- Test: `tests/core/convertMarkdown.test.ts`
- Test: `tests/popup/app.test.ts`
- Create: `tests/popup/main.test.ts`

### Task 1: Define the table-format option shape

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/content/main.ts`

- [ ] **Step 1: Write the failing type-driven test**

Add a small popup bootstrap test in `tests/popup/main.test.ts` that expects the export message to include `tableFormat: 'markdown'`.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
npx vitest run tests/popup/main.test.ts
```

Expected: FAIL because the popup/export message flow does not yet include `tableFormat`.

- [ ] **Step 3: Add the shared types**

Add to `src/core/types.ts`:

```ts
export type TableFormat = 'markdown' | 'html';

export interface ExportOptions {
  tableFormat: TableFormat;
}
```

Update the content-script message shape in `src/content/main.ts` so `export-current-page` carries `options: ExportOptions`.

- [ ] **Step 4: Re-run the targeted test**

Run:

```bash
npx vitest run tests/popup/main.test.ts
```

Expected: still failing, but now on missing runtime wiring rather than missing types.

### Task 2: Add popup UI and persistence

**Files:**
- Modify: `src/popup/app.ts`
- Modify: `src/popup/main.ts`
- Test: `tests/popup/app.test.ts`
- Create: `tests/popup/main.test.ts`

- [ ] **Step 1: Write the failing popup tests**

Add tests that expect:

```ts
expect(document.querySelector('label')?.textContent).toContain('Table format');
expect(document.querySelector('select')?.value).toBe('markdown');
```

and a bootstrap test that:

```ts
expect(chrome.storage.local.get).toHaveBeenCalled();
expect(chrome.storage.local.set).toHaveBeenCalledWith({ tableFormat: 'html' });
expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
  { type: 'start-export', options: { tableFormat: 'html' } },
  expect.any(Function)
);
```

- [ ] **Step 2: Run the popup tests to verify they fail**

Run:

```bash
npx vitest run tests/popup/app.test.ts tests/popup/main.test.ts
```

Expected: FAIL because the selector is not rendered and popup persistence is not implemented.

- [ ] **Step 3: Implement the popup UI and persistence**

In `src/popup/app.ts`, extend the ready state to carry `tableFormat` and render:

```ts
const label = document.createElement('label');
label.htmlFor = 'table-format';
label.textContent = 'Table format';

const select = document.createElement('select');
select.id = 'table-format';
```

with `Markdown` and `HTML` options.

In `src/popup/main.ts`:

- load `tableFormat` from `chrome.storage.local`
- default to `'markdown'`
- persist on selector change
- send `{ type: 'start-export', options: { tableFormat } }`

- [ ] **Step 4: Re-run the popup tests**

Run:

```bash
npx vitest run tests/popup/app.test.ts tests/popup/main.test.ts
```

Expected: PASS.

### Task 3: Thread the option through the export pipeline

**Files:**
- Modify: `src/background/main.ts`
- Modify: `src/content/exportCurrentPage.ts`
- Modify: `src/content/main.ts`
- Test: `tests/popup/main.test.ts`

- [ ] **Step 1: Write the failing flow test**

Add a test that expects the chosen table format to be forwarded from popup to background and then into content export.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
npx vitest run tests/popup/main.test.ts
```

Expected: FAIL because background/content currently ignore export options.

- [ ] **Step 3: Implement the message flow**

Update:

- `src/background/main.ts` to return `{ kind: 'ready', tableFormat }` from `get-popup-state`
- `src/background/main.ts` to pass `options` through `chrome.tabs.sendMessage(...)`
- `src/content/main.ts` to read `message.options`
- `src/content/exportCurrentPage.ts` to accept `options: ExportOptions`

- [ ] **Step 4: Re-run the targeted test**

Run:

```bash
npx vitest run tests/popup/main.test.ts
```

Expected: PASS.

### Task 4: Add HTML-table export mode in the converter

**Files:**
- Modify: `src/core/convertMarkdown.ts`
- Test: `tests/core/convertMarkdown.test.ts`

- [ ] **Step 1: Write the failing conversion tests**

Add two focused tests around the same input:

```ts
const contentHtml = '<p>Before</p><table><tr><th>A</th></tr><tr><td>B</td></tr></table><p>After</p>';
```

Expect:

1. In `markdown` mode, output contains a Markdown table or the current markdownified table output.
2. In `html` mode, output contains the raw `<table>...</table>` block and still converts `Before` / `After` to Markdown text.

- [ ] **Step 2: Run the targeted converter tests to verify they fail**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts
```

Expected: FAIL because conversion does not yet accept a table-format option.

- [ ] **Step 3: Implement the minimal converter change**

Update `convertExtractedPageToMarkdown` to accept:

```ts
options: ExportOptions
```

and preserve table nodes as raw HTML only when `options.tableFormat === 'html'`.

Keep link normalization for table HTML.

- [ ] **Step 4: Re-run the converter tests**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts
```

Expected: PASS.

### Task 5: Document and verify the feature end-to-end

**Files:**
- Modify: `README.md`
- Test: `tests/core/convertMarkdown.test.ts`
- Test: `tests/popup/app.test.ts`
- Test: `tests/popup/main.test.ts`

- [ ] **Step 1: Update the README**

Document that the popup now includes a persistent `Table format` option with `Markdown` and `HTML`.

- [ ] **Step 2: Run the focused regression tests**

Run:

```bash
npx vitest run tests/core/convertMarkdown.test.ts tests/popup/app.test.ts tests/popup/main.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the full suite**

Run:

```bash
npm test
```

Expected: PASS with all tests green.

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS and updated artifacts in `dist/`.
