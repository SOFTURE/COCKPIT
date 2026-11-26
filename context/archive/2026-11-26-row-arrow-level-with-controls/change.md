---
change_id: row-arrow-level-with-controls
title: "A row's arrow level with its controls"
status: archived
roadmap_item: null
branch: claude/project-thread-k0no8o
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
In every list row that opens a page and has a state or controls, the arrow on the right and the state and controls
beside it share one vertical middle. Today the arrow stands higher than a taller control next to it, e.g. the trash
can of a sent broadcast on Broadcast → Sent.

## Context
The owner's message of 2026-11-26 18:40Z with a screenshot of a sent broadcast's row in production (v2026.11.26): the
trash can sits lower than the arrow ("popraw krzywo"). The owner's standing rule (2026-11-25 12:26Z): every UI fix is a
standard in one shared place, applied app-wide. Follows `row-state-and-controls-on-one-line` (PR #146), which put a
row's state and controls on one line in `app/row-layout.css`.

## Constraints
- One shared place for the rule, app-wide; no per-screen styling.
- A row with a `data-row-wide` control keeps the theme's layout.
- No release, tag, publish or deploy (one release later, on the owner's word).

## Decisions (auto)
- The rule joins `app/row-layout.css` (the app's row standard) until theme-notion ships it; the gap is filed as
  SOFTURE/AI#1520 and named in the stylesheet.
- The check joins `e2e/expect-list-entry-rows.ts`, which every list's spec already calls, so every row list in the app
  is held to it.

## Notes
- Frame skipped: the owner named the defect with a screenshot.

## Done
- Merged with the pull request of branch `claude/project-thread-k0no8o`.
