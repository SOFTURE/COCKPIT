---
change_id: roadmap-status-pills-full-width
title: "Roadmap statuses as quiet pills and pages at full width"
status: archived
roadmap_item: null
branch: claude/project-thread-f55mzs
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
On the roadmap view and the project page, an item's status reads as a short coloured word with its icon (Notion
style), and its condition or stage sits under the title as quiet text, instead of a large red block that carries the
whole condition. The pages use the full width of the screen, and a long roadmap title becomes a short page title
with the rest as its subtitle.

## Context
The owner reported the status badges on a real roadmap as unreadable (screenshots in the thread): every blocked item
showed a wide red badge with its full waiting condition, the page stayed in a narrow column on a wide screen, and a
long roadmap title filled three lines of the page heading.

## Constraints
- theme-notion components only (`Status`, `FoldRow`, `DetailTable`), design tokens, copy through `messages/en.ts`.
- Settings keeps its narrow form column; the shell no longer caps the width of other pages.
- No change to parsing, loading or the scan.

## Notes
- research skipped: a presentation change to two components written in the previous change of this thread; the code
  was read in full while planning.
- frame skipped: the owner named the problem and the expected look.

## Done
- Merged as one pull request; released with the owner's word.
