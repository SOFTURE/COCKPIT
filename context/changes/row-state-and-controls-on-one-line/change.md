---
change_id: row-state-and-controls-on-one-line
title: "A row's state and its controls on one line"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-msnfvh
created: 2026-11-26
updated: 2026-11-26
---

## Intent
In every list row and folding row that has both a state and controls, the state badge and the controls sit on one
line on the right: the state on the left, the controls (a trash can, a switch, Retry, the "More actions" button) on
its right. Today the state stands on top of the right column and the controls under it, so a watched repository on
Settings shows "Readable" above its trash can.

## Context
The owner's message of 2026-11-26 10:36Z with a screenshot of the Settings watched-repositories list ("Czytelne" badge
above the trash can): "the trash can on the right and the label left of the trash can, on one line". The owner's
standing rule (2026-11-25 12:26Z): every UI fix is a standard in one shared place, applied app-wide.

theme-notion 0.37.1 (latest) lays out `ListEntry` and `FoldRow` (from `md`) as a column: status on top, controls
under it, and has no option for one line. Rows with both today: Settings repositories, Team, routines, fired issues,
inbox (answered, put off), Broadcast project rows, roadmap items with a promote control.

This reverses the "state on line 1, controls on line 2" part of the binding layout rule for CT-25..CT-28 in
`context/foundation/roadmap.md` for every row from now on.

## Constraints
- One shared place for the rule, app-wide; no per-screen styling.
- A row whose controls need the full width (`data-row-wide`, the inbox's answer being confirmed) keeps its layout.
- No release, tag, publish or deploy (one release at the end of the batch).

## Decisions (auto)
- The rule lives in the app's stylesheet (`app/row-layout.css`, imported by `app/globals.css`), targeting the theme's
  `data-slot` hooks, until theme-notion offers the one-line layout itself; the package gap is filed in SOFTURE/AI and
  the stylesheet names the issue, to be dropped when the theme ships it. Waiting for a package release would hold the
  owner's fix past this batch's release.

## Notes
- Frame skipped: the owner named the exact layout.
