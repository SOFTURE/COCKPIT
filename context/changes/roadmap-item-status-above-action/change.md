---
change_id: roadmap-item-status-above-action
title: "A roadmap item's status above its Promote, in one box"
status: new
roadmap_item: CT-11
branch: claude/project-thread-g7uwem
created: 2026-11-25
updated: 2026-11-25
---

## Intent
On the roadmap view an item's status (for example "Blocked") sits at the top of the bar's right column and its
"Promote to work" (or the issue it became) right under it, inside the item's bar, so the bar lights as one box on
hover.

## Context
The owner (2026-11-25 12:52 Warsaw, F-10) sent a screenshot of a queued roadmap's item: the status stood on the
title's line and the Promote button in a separate strip beside the bar, with a mismatched background under it.
Evidence: `cockpit/evidence/roadmap-item-status-above-action/01-item-row-before-3238-dark.webp`.

## Constraints
- The action stays outside the `<summary>`: a control inside it is a nested control.
- The row keeps the shared inset of `src/shell/row-inset.ts` (PR #96).
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual fix the owner asked for with screenshots; the outcome is not in doubt.
