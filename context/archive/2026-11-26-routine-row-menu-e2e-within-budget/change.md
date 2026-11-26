---
change_id: routine-row-menu-e2e-within-budget
title: "The routine row menu e2e stays within its time budget under the CI load pass"
status: archived
roadmap_item: null
branch: claude/project-thread-xo03ry
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
Master CI stays green: `e2e/routines.spec.ts` "a routine is managed from its row menu at 1280 and 390 px" no longer
runs past the 30 s test budget in the "e2e under load" step.

## Context
Master CI on fa140f1 (run 45791785761) failed in "e2e under load" (`--workers=4`): this test hit "Test timeout of
30000ms exceeded" (33.7 s). It is the same cause `routines-e2e-within-budget` fixed for the fire flow in the same
spec: one test chains a full flow (watch, add, then keyboard, Test, Replace token, switch and Cancel on delete at two
widths, then delete), 11 to 16 s alone, past 30 s under four workers. That change should have split this sibling too.

## Constraints
- No product code change; no global timeout raised; no test loosened.

## Notes
- Research skipped: the cause is read from the run's log, as in `routines-e2e-within-budget`.
- Frame skipped: a red master is fixed as found.
- Other tests that came near the budget under load in the same run (row-facts 35.2 s with its own 90 s budget,
  project-page 27.4 s, broadcast 23.6 s) are reported to the coordinator, not changed here.

## Done
The routine row menu flow runs as four serial e2e tests, each well within the 30 s budget under the four-worker load pass.
