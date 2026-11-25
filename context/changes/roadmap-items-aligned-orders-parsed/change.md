---
change_id: roadmap-items-aligned-orders-parsed
title: "Roadmap items read on one grid with the ID in a badge; run-wide orders parse labels with code in them"
status: planned
roadmap_item: null
branch: claude/project-thread-zv1fxh
created: 2026-11-25
updated: 2026-11-25
---

## Intent
On the roadmap view, the "Items" list reads cleanly: the item ID sits in a badge, and the chevron, ID, title, status
detail, outcome and status line up on one grid in every row, on a phone and on a desktop. The "Run-wide orders" card
shows each order whole: a label that carries code with a colon (`Owner at the keyboard (`Mode: owner`)`) is no longer
cut at that colon, and the known labels and simple values read in the panel's language.

## Context
The owner called the items list ugly: the ID is plain grey monospace text, the chevron is centred on the whole row
while the ID and title sit on its first line, and the status floats on its own. The orders card splits
`Owner at the keyboard (`Mode: owner`): LT-1, LT-2` at the colon inside the backticks, so the label reads
"Owner at the keyboard (`Mode" and the value "owner`): LT-1, LT-2" (`ORDER_RE` in `src/roadmap/parse-roadmap.ts`).

## Constraints
- Design-system pieces and tokens only (`@softure-ai/theme-notion` Badge, FoldRow), no raw colours or magic sizes.
- The roadmap's read and its data stay as they are; only the order split and the presentation change.
- User-visible text through the message dictionaries.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the defects live in one parser function and one view component, both read in full; the data
  shape gains one optional field (`note`).
- Frame skipped: two visual defects reported by the owner; the outcome is not in doubt.
