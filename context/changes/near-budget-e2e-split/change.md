---
change_id: near-budget-e2e-split
title: "Three e2e flows close to the time budget under load run as serial steps"
status: implementing
roadmap_item: null
branch: claude/project-thread-xo03ry
created: 2026-11-26
updated: 2026-11-26
---

## Intent
Pre-release hardening: the three single-test flows that came closest to the 30 s test budget in the CI's
"e2e under load" step no longer chain a whole flow in one test, so master CI stays green as the suite grows.

## Context
Master run 45791785761 ("e2e under load", `--workers=4`) timed `e2e/project-page.spec.ts:79` at 27.4 s,
`e2e/broadcast.spec.ts:111` at 23.6 s and `e2e/routine-steps.spec.ts:49` at 23.1 s. Two neighbours in the same spec
families already ran past 30 s and were split (`routines-e2e-within-budget`, `routine-row-menu-e2e-within-budget`).

## Constraints
- No product code change; no global timeout raised; no assertion dropped or loosened.

## Notes
- Research skipped: the durations are read from the run's log and the specs are self-contained.
- Frame skipped: the coordinator approved the split as pre-release hardening.
