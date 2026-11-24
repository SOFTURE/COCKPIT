---
change_id: roadmap-open-waits-under-load
title: "Every roadmap-page open in the e2e waits for its forge read, so master's e2e under load is green"
status: archived
roadmap_item: null
branch: claude/project-thread-v9mlm0
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
The `ci` job `e2e` on master passes its "e2e under load" step (4 workers): no roadmap-page open in
`e2e/project-page.spec.ts` fails on the 5-second default while the page reads its file from the forge.

## Context
Master `ci` run 45416146448 (dd7f81d, #78) failed in "e2e under load": the heading "Omicron v2" did not show within
5 s after opening the second roadmap. The change `header-refresh-own-e2e-server` gave only the first open
("Omicron v1") the named bound `OPEN_FROM_FORGE_MS`; the other opens of the same page (the second roadmap, the
unreadable-file notice, the phone view) still used the default. The same test design gap, not a product bug.

## Constraints
- No retries, no assertion loosened, no product code change.

## Notes
- Research skipped: the failing run's log and the spec are the investigation, recorded above.
- Frame skipped: the outcome (green master) is the owner's standing order.

## Done
- The three remaining first waits after a roadmap-page open use `OPEN_FROM_FORGE_MS` (15 s).
