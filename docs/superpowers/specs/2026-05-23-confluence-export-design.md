# Confluence Export Design

**Goal:** Build a Chrome Manifest V3 extension that exports the currently open Confluence Cloud page to a GitHub Flavored Markdown file with pragmatic fidelity, automatic download, and clear warning/error feedback.

## Scope

This design covers the MVP only:

- Confluence Cloud only
- Regular Confluence pages only
- Popup-triggered export
- Local, client-side extraction and conversion
- Automatic `.md` download
- Graceful fallback for unsupported Confluence-specific content

Out of scope for this design:

- Confluence Server or Data Center
- Bulk export or recursive page export
- Preview before download
- Asset bundling for images or attachments
- Reverse sync back to Confluence
- Metadata/frontmatter modes

## Architecture

The extension is split into three runtime pieces:

1. **Popup UI**  
   Shows whether the active tab is exportable, provides the primary export action, and displays success, warning, or error feedback.

2. **Service Worker**  
   Orchestrates export requests, coordinates tab access and message passing, runs download creation, and returns structured results to the popup.

3. **Content Script**  
   Runs in the Confluence page, reads the DOM, finds the title and main content, and returns a normalized page representation for conversion.

Browser-specific concerns stay in these runtime pieces. Confluence and Markdown logic live in isolated core modules so they can be tested without the full extension shell.

## Core Modules

The MVP should be built around these focused modules:

### Page Eligibility

Determines whether the active tab is a supported Confluence Cloud page and returns either a supported-page result or a structured unsupported reason.

Responsibilities:

- Identify Confluence Cloud URLs and page context
- Distinguish regular pages from unsupported contexts
- Provide user-facing unsupported reasons

### Content Extraction

Reads the loaded Confluence DOM and produces a normalized representation of the page content.

Responsibilities:

- Read the page title
- Locate the main content root
- Exclude navigation, footer chrome, comments, reactions, inline comment markers, edit metadata, and similar collaboration UI
- Include collapsed content only when it already exists in the DOM
- Discover usable image and attachment links when present
- Avoid mutating the page, expanding content, or triggering extra loading

### Markdown Conversion

Transforms normalized extracted content into GitHub Flavored Markdown and emits structured warnings for lossy conversion.

Responsibilities:

- Convert headings, paragraphs, emphasis, lists, links, inline code, code blocks, tables, blockquotes, and horizontal rules
- Convert Confluence-specific panels to labeled blockquotes
- Convert status elements to compact inline labels
- Convert task lists to GFM task syntax
- Preserve emojis as Unicode
- Render mentions as readable names, preserving links only when stable and useful
- Preserve code fence language identifiers when explicitly available
- Simplify complex tables instead of failing
- Replace unsupported macros with readable placeholders plus warnings

### Filename Normalization

Derives the download filename from the page title.

Responsibilities:

- Preserve Unicode characters
- Replace filesystem-invalid characters
- Guarantee `.md` suffix

### Export Orchestration

Coordinates the full export flow from popup action to final download.

Responsibilities:

- Request eligibility and extraction
- Apply a short bounded retry when content is not ready
- Call conversion and collect warnings
- Trigger automatic file download
- Return a structured result for popup rendering

## Data Flow

1. Popup opens and checks the active tab.
2. Eligibility logic determines whether the page is supported.
3. Popup shows either a disabled state with explanation or an enabled export action.
4. User clicks **Export Markdown**.
5. Service worker requests content extraction from the active tab.
6. If content is not yet ready, orchestration retries for a short bounded window.
7. Extracted content is converted to GFM plus warnings.
8. Filename normalization generates the download name from the page title.
9. Service worker triggers automatic download.
10. Popup shows success, success with warning count, or a clear error.

## Output Rules

The exported Markdown must follow these rules:

- Target format is GitHub Flavored Markdown
- The page title is included as the first `#` heading
- The filename is derived from the page title
- Internal or relative links should be resolved to absolute URLs where possible
- Images are represented as Markdown image references or links when a usable URL exists
- Non-image attachments are included as links when discoverable
- No extra metadata block or frontmatter is added in the MVP
- Raw HTML should be avoided whenever a readable Markdown representation exists

## Error Handling

The MVP should fail clearly and predictably.

Supported error cases:

- Active tab is not a supported Confluence page
- Page content cannot be read
- Page is not fully ready after bounded retry
- Conversion fails
- Download creation fails

Behavior:

- Unsupported pages show a disabled popup action and a short explanation
- Partial conversion does not fail the export when readable fallback output is possible
- Warnings are surfaced as a count in the popup after successful export
- Fatal failures produce a clear, user-facing error message

## Testing Strategy

Testing should focus on external behavior, not implementation details.

### Module Tests

Cover:

- Page eligibility behavior
- Filename normalization behavior
- Warning generation behavior

### Fixture-Based Conversion Tests

Cover:

- Standard HTML structures
- Confluence-specific panels, status elements, task lists, mentions, emojis, and macros
- Complex-table simplification behavior
- Attachment and image link extraction behavior
- Collapsed-but-present DOM content behavior

### Popup Behavior Tests

Cover:

- Unsupported page state
- Running state
- Success state
- Success-with-warnings state
- Error state

The heaviest coverage should be on extraction and conversion modules, because they carry most of the product risk.

## Implementation Boundaries

To keep the MVP small and durable:

- Do not introduce preview mode
- Do not download image or attachment binaries
- Do not support more than one page at a time
- Do not attempt perfect rendering fidelity for every Confluence macro
- Do not couple popup rendering to DOM traversal details

## Risks

- Confluence Cloud DOM structure may vary across pages and change over time
- Some macros and complex tables cannot be mapped perfectly into Markdown
- Selector drift can break extraction if DOM assumptions become stale

## Recommendation

Implement the MVP as a modular TypeScript + Vite + Vanilla DOM extension. Keep the extension shell thin, isolate Confluence extraction and Markdown conversion in small testable modules, and use TDD around the riskiest behavior first: page detection, extraction fixtures, and Markdown conversion fallbacks.
