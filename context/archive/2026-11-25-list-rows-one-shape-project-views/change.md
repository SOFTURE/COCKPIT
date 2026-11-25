---
change_id: list-rows-one-shape-project-views
title: "The project views use the one list row and result badge"
status: archived
roadmap_item: CT-19
branch: claude/project-thread-9wkv74
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
Every remaining list in COCKPIT uses CT-18's `ListRow` and `ResultBadge`: identity left, state badge on top of the
right column with the actions under it, one hover box for a row that opens something, one colour language for results.

## Context
The owner (2026-11-25 13:27 Warsaw, translated): "every fix is a standard, across the whole app". Audit of master
(8cf56ef), lists not on the row standard:
- Overview (`src/overview/overview-row.tsx`): link on the name only, badges in a line under it.
- Inbox (`src/inbox/inbox-row.tsx`): its own right column for the answer; aligns with the component.
- Project page (`src/project-page/project-page-sections.tsx`): roadmap item rows (status pill right, fine) and
  changes rows (stage badge on the left, `mt-0.5 shrink-0`), queued roadmaps (lit row, reference).
- History tab (`src/project-page/history/history-sections.tsx`): CI runs show their result first on the left; merges
  and releases have no right column; doctor findings put the code badge first.
- Deploys (`src/adapters/deploy/deploys-list.tsx`): release, production and result badges in a line under the name.
- Packages (`src/adapters/packages/packages-details.tsx`): version rows with the behind/current badge inline.

## Constraints
- Reuse CT-18's components only; if one needs a slot, add it there.
- No change to what any row says or links to; e2e selectors (`data-*`) stay.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
- Archived 2026-11-25: the overview, inbox, project page, history, Deploys and Packages lay their rows out with `ListRow` and show every result with `ResultBadge` in the one tone map.
