# Table Format Option Design

**Goal:** Add a popup UI option that lets the user choose whether Confluence tables are exported as Markdown tables or preserved as raw HTML tables.

## Scope

This design adds one persistent export option to the existing MVP:

- Popup UI control for table export format
- Persistent storage of the chosen format
- Export message flow updated to carry the chosen format
- Markdown conversion updated to support two table modes

Out of scope:

- Per-table decisions inside a single export
- Separate file formats or extensions
- Rich preview of the selected mode
- Additional formatting options beyond tables

## Recommended Approach

Use a single persistent popup control backed by `chrome.storage.local`.

Why:

- It fits the current one-popup, one-export-action UX
- It avoids multiplying buttons in the small popup
- It keeps the choice explicit and stable across exports
- It requires only narrow changes in popup, background, and conversion code

## UX

- The popup keeps the existing single export button.
- Above the button, add a labeled control: `Table format`.
- Available values:
  - `Markdown`
  - `HTML`
- Default value is `Markdown` when no prior selection exists.
- When the user changes the value, it is saved immediately.
- Reopening the popup restores the saved value.

## Data Flow

1. Popup opens and asks the background for popup state.
2. Background returns the normal page state plus the persisted `tableFormat`.
3. Popup renders the selector with the current value.
4. User clicks export.
5. Popup sends `start-export` including the selected `tableFormat`.
6. Background forwards the option to the content script.
7. Content conversion uses the selected mode.
8. Background downloads the resulting `.md` file and returns the usual success/error state.

## Data Model

Introduce one serializable option:

- `tableFormat: 'markdown' | 'html'`

Rules:

- `markdown` means table content should continue through Markdown conversion.
- `html` means `<table>` elements should remain raw HTML in the final Markdown document while the rest of the document still converts normally.

## Conversion Behavior

### Markdown mode

- Preserve current behavior.
- Existing table conversion continues to flow through Turndown/GFM behavior.

### HTML mode

- Table elements are preserved as raw HTML blocks in the final output.
- Only table nodes are preserved as HTML; surrounding content still converts to Markdown.
- Links inside preserved tables remain absolute URLs, matching the existing normalization behavior.

## Error Handling

- If storage has no saved value, use `markdown`.
- If a malformed value is encountered, fall back to `markdown`.
- Export success and error messaging remain unchanged.
- The option must not block export if storage access returns no saved value.

## Testing Strategy

Add tests for:

- Popup rendering with the table-format control
- Persisted selection loading and saving
- Background message flow carrying `tableFormat`
- Conversion in `markdown` mode
- Conversion in `html` mode with preserved `<table>` output

## File Impact

- `src/core/types.ts` — add serializable table-format type and export-option shape
- `src/core/convertMarkdown.ts` — accept export options and preserve tables in HTML mode
- `src/content/exportCurrentPage.ts` — pass export options into conversion
- `src/content/main.ts` — accept message payload including `tableFormat`
- `src/background/main.ts` — load persisted option and forward it during export
- `src/popup/app.ts` — render selector in the ready state
- `src/popup/main.ts` — load, display, persist, and submit selected option
- `tests/core/convertMarkdown.test.ts` — add mode-specific table tests
- `tests/popup/app.test.ts` — add selector rendering tests
- `tests/popup/main.test.ts` — add loading, saving, and export-submission tests for `tableFormat`

## Recommendation

Implement the feature as a narrow additive change to the current export pipeline: persist a popup-level `tableFormat` setting, thread it through the existing message flow, and teach the converter to preserve only table nodes as raw HTML when requested.
