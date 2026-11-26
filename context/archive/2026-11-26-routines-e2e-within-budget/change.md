---
change_id: routines-e2e-within-budget
title: "The routines fire e2e stays within its time budget under the CI load pass"
status: archived
roadmap_item: null
branch: claude/project-thread-xo03ry
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
Master CI stays green: `e2e/routines.spec.ts` "a routine is added, tested, fired once per project by a broadcast,
and Retry recovers a failed fire" no longer runs past the 30 s test budget in the "e2e under load" step.

## Context
Master CI on 5329792 (run 45782514173) failed in "e2e under load" (`--workers=4`): the test hit "Test timeout of
30000ms exceeded" (33.9 s). It passed in the plain pass on the same run in 12.0 s. The page snapshot at the timeout
shows the test's final state already reached (the signal-web routine's last call HTTP 200, the issue fired), so no
step hung: the single test chains watching two repositories, adding two routines, a Test, a broadcast, a Retry and
the Routines tab, about 12 s of work that under four parallel workers exceeds the whole-test budget.

## Constraints
- No product code change; no global timeout raised; no test loosened.

## Notes
- Research skipped: the cause is read from the run's log and page snapshot above.
- Frame skipped: a red master is fixed as found.

## Done
The routines fire flow runs as three serial e2e tests, each well within the 30 s budget under the four-worker load pass.
