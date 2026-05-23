## Problem Statement

Users need a fast, low-friction way to take the currently open Confluence Cloud page and turn it into a portable Markdown document they can store locally, commit to a repository, or reuse in Markdown-based tools. Today, that workflow is manual and error-prone: users must copy content out of Confluence, clean away product UI, reconstruct document structure, and fix Confluence-specific elements by hand. The lack of a browser-local export path makes archiving, migration, and downstream reuse unnecessarily slow.

## Solution

Provide a Chrome extension that detects supported Confluence Cloud pages, lets the user start export from a popup, extracts the page title and main content from the active tab, converts that content into GitHub Flavored Markdown, and downloads a `.md` file automatically. The export should preserve the document's structure, exclude surrounding Confluence collaboration UI, degrade gracefully when elements cannot be represented perfectly in Markdown, and surface warnings when simplifications were required.

## User Stories

1. As a Confluence user, I want to export the currently open page to Markdown, so that I can reuse it outside Confluence.
2. As a technical writer, I want the export to preserve headings and paragraphs, so that the document remains readable without reformatting.
3. As a developer, I want the export to target GitHub Flavored Markdown, so that tables and task lists work well in repository workflows.
4. As a project team member, I want the export to download as a `.md` file automatically, so that the workflow stays fast and low-friction.
5. As a user, I want the file name to be derived from the Confluence page title, so that the downloaded file is easy to identify.
6. As a user, I want the page title included as the first Markdown heading, so that the file remains self-describing if renamed later.
7. As a user, I want the extension to work only on supported Confluence Cloud pages, so that I am not misled on unsupported pages.
8. As a user, I want the export button disabled on unsupported pages, so that I understand immediately why export is unavailable.
9. As a user, I want a clear explanation when a page cannot be exported, so that I know whether retrying will help.
10. As a user, I want the exporter to capture only the main page content, so that navigation, footer chrome, and surrounding product UI do not pollute the Markdown.
11. As a user, I want comments and collaboration UI excluded from the export, so that the Markdown reflects the document rather than the editing surface.
12. As a user, I want ordered and unordered lists preserved, so that procedural and grouped content remains structured.
13. As a user, I want links preserved, so that references remain usable after export.
14. As a user, I want relative or internal Confluence links resolved to absolute URLs when possible, so that the Markdown stays portable outside the original browsing context.
15. As a user, I want inline code and fenced code blocks preserved, so that technical content remains accurate.
16. As a user, I want code block languages preserved when available, so that downstream Markdown renderers can highlight code correctly.
17. As a user, I want tables represented in Markdown where possible, so that structured data is retained.
18. As a user, I want complex tables simplified instead of breaking the export, so that I still keep the information even when perfect fidelity is impossible.
19. As a user, I want a warning when a complex table was simplified, so that I know where manual review may be useful.
20. As a user, I want blockquotes and horizontal rules preserved, so that document emphasis and separation remain visible.
21. As a user, I want Confluence task lists converted to Markdown checklists, so that task state remains clear and editable.
22. As a user, I want panel-like elements such as info or warning boxes represented clearly in Markdown, so that their semantics survive export.
23. As a user, I want status lozenges represented as readable inline labels, so that status meaning is not lost.
24. As a user, I want mentions rendered as readable names, so that the text remains understandable outside Confluence.
25. As a user, I want mention links preserved only when stable and useful, so that the Markdown does not accumulate brittle internal references.
26. As a user, I want emojis preserved as Unicode characters, so that emotional and semantic cues remain intact.
27. As a user, I want unsupported Confluence macros handled gracefully, so that one unsupported element does not ruin the entire export.
28. As a user, I want unsupported macros represented with readable placeholders, so that information loss is minimized and visible.
29. As a user, I want collapsed content exported when it is already present in the DOM, so that hidden but loaded content is not silently omitted.
30. As a user, I do not want the extension to trigger unpredictable page interactions just to collect more content, so that export remains deterministic.
31. As a user, I want images represented as Markdown image references or links when a usable URL exists, so that visual context is retained without a multi-file bundle.
32. As a user, I want non-image attachments included as links when they are discoverable, so that referenced files are not lost completely.
33. As a user, I do not want the MVP to download or package binary assets, so that the first release stays simple and reliable.
34. As a user, I want the conversion to run locally in the browser, so that page content is not unnecessarily sent to external services.
35. As a user, I want the export to complete within a few seconds on a normal page, so that the extension feels responsive.
36. As a user, I want the exporter to retry briefly when the page content is still loading, so that transient load timing does not cause unnecessary failure.
37. As a user, I want a clear error if the page is still not ready after a short retry window, so that the extension fails predictably.
38. As a user, I want the popup to show success feedback after export, so that I know the download was triggered intentionally.
39. As a user, I want the popup to summarize non-fatal warnings, so that I can judge whether the exported Markdown may need review.
40. As a user, I want the exported Markdown to avoid raw HTML wherever possible, so that it stays broadly portable across Markdown tools.
41. As a maintainer, I want the selector logic and conversion rules isolated from the popup UI, so that extractor changes do not ripple through the whole extension.
42. As a maintainer, I want Confluence-to-Markdown mapping rules grouped in focused modules, so that support for additional element types can grow without destabilizing the core flow.
43. As a maintainer, I want unsupported content handling centralized, so that fallback behavior is consistent across macros and rich content.
44. As a maintainer, I want filename sanitization encapsulated behind a stable interface, so that naming rules stay easy to evolve.
45. As a maintainer, I want the conversion pipeline to expose structured warnings, so that the UI can summarize partial success without parsing Markdown output.
46. As a maintainer, I want the export flow to be testable through stable external behavior, so that the implementation can evolve without brittle tests.
47. As a future product owner, I want the MVP architecture to leave room for preview mode, metadata modes, and broader content coverage later, so that future versions can grow without a rewrite.

## Implementation Decisions

- The MVP targets Confluence Cloud only. Server and Data Center are out of scope because their DOM structures materially broaden extraction complexity and selector maintenance.
- The output format is GitHub Flavored Markdown. This is the primary compatibility target for v1 because it provides pragmatic support for tables and task lists while remaining broadly readable.
- The exported document includes the page title both in the file name and as the first `#` heading in the Markdown body.
- The extension is organized around a small set of deep modules with narrow, stable interfaces:
  - A page eligibility module determines whether the active tab is a supported Confluence Cloud page and returns either a supported-page descriptor or an unsupported reason.
  - A content extraction module reads the active document and produces a normalized representation of the page title, main content root, discovered attachments, and source metadata needed for conversion.
  - A Markdown conversion module transforms the normalized representation into GFM plus a structured warning list.
  - A download orchestration module derives the file name, creates the downloadable payload, and invokes the browser download mechanism.
  - A popup state module coordinates eligibility, export execution, success, warning, and error states for the extension UI.
- The content extraction module focuses on the main page body and explicitly excludes navigation, footer chrome, comments, reactions, inline comment markers, edit metadata, and similar collaboration UI.
- Only regular Confluence pages are treated as supported content types in the MVP. Other content types should surface as unsupported unless they render into the same stable page-content contract.
- Collapsed or hidden content is included only when it is already present in the DOM. The extension should not click, expand, or otherwise mutate the page in order to fetch additional content.
- Internal and relative links should be resolved to absolute URLs when enough context exists to do so safely.
- Images are represented as Markdown image references or plain links when a usable URL is available. The MVP does not package or download image binaries.
- Non-image attachments are included only as links when they are discoverable from the page content. The MVP does not download them.
- Unknown or unsupported macros never abort export on their own. They are converted into readable placeholder text and also generate structured warnings.
- Panel-like constructs such as info, note, and warning blocks are rendered as blockquotes with a leading semantic label.
- Status lozenges are rendered as compact inline labels that preserve meaning rather than visual styling.
- Mentions are rendered as readable display names, optionally prefixed in an `@name` style, and links are preserved only when they are stable and useful outside the current page session.
- Emojis are preserved as Unicode where available.
- Task lists are emitted as native GFM task list items.
- Code blocks use fenced Markdown, preserving explicit language identifiers when the source exposes them reliably. The converter should not infer languages aggressively.
- Complex tables that cannot be represented cleanly in GFM are simplified into a readable Markdown or text form, with warnings emitted to the user-facing summary.
- The popup is the single primary interaction surface in the MVP. It contains the export action, disabled-state messaging for unsupported pages, and result feedback for success, warnings, and errors.
- The happy path is straight-through export with automatic download and no preview screen.
- If the page content appears not ready, the export flow performs a short bounded retry before failing with a clear error.
- Filename normalization keeps Unicode characters and replaces only filesystem-invalid characters before appending the `.md` extension.
- The MVP does not add YAML frontmatter or append extra metadata such as source URL or export timestamp to the Markdown output.
- The architecture should keep DOM selection concerns separate from Markdown rendering concerns so that selector drift and output-format evolution can be managed independently.

## Testing Decisions

- Good tests should validate externally observable behavior: whether supported pages are recognized correctly, whether extracted content produces the expected Markdown and warnings, whether unsupported content degrades gracefully, whether filenames are sanitized correctly, and whether the popup exposes the correct user-visible state for success and failure paths. Tests should avoid coupling to internal implementation details or incidental DOM traversal structure.
- The page eligibility module should be tested with representative supported and unsupported page descriptors so that page gating remains stable as selectors evolve.
- The content extraction module should be tested against representative Confluence Cloud DOM fixtures covering main content, excluded chrome, collapsed-but-present content, attachments, and unsupported structures.
- The Markdown conversion module should receive the strongest test coverage. It is the core deep module and should be exercised with fixture-driven cases for headings, paragraphs, emphasis, lists, links, code blocks, tables, panels, status elements, mentions, emojis, task lists, attachments, and unsupported macros.
- The fallback and warning pipeline should be tested explicitly to ensure partial conversion produces readable output plus deterministic warning summaries rather than silent loss.
- The filename normalization module should be covered with edge-case titles containing slashes, punctuation, Unicode characters, and duplicate separators.
- The popup state module should be tested at the UI behavior level: unsupported page state, loading/retry state, successful export state, and success-with-warnings state.
- Prior art does not yet exist in this repository because the codebase currently contains only requirements material. The test strategy should therefore prefer small, isolated module tests and fixture-based behavior tests over a heavy end-to-end harness in the first iteration.

## Out of Scope

The MVP does not support Confluence Server or Data Center, bulk export, recursive export of subpages, space-wide export, reverse synchronization back to Confluence, integration with Git/Notion/Obsidian, login handling beyond the active browser session, binary download or bundling of images and attachments, Markdown preview before download, clipboard copy, perfect fidelity for every Confluence macro, all Confluence content types, or extra metadata modes such as frontmatter.

## Further Notes

- The main delivery risk is DOM variability within Confluence Cloud and future selector drift as the product UI changes.
- The product should optimize for pragmatic readability and information preservation rather than pixel-perfect visual parity.
- Structured warnings are a product feature, not just an implementation detail: they are the contract that makes graceful degradation trustworthy.
- The chosen module boundaries intentionally favor deep, testable interfaces so that future enhancements such as preview mode, metadata modes, additional macro support, or other browser targets can be layered onto a stable core.
