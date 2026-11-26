---
change_id: release-gap-job-schedules
title: "The worker's one-minute schedules for routine fires and scheduled tasks are pinned by a test"
status: archived
roadmap_item: null
branch: claude/project-thread-xo03ry
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
Pre-release test-gap review of cockpit-v4 (CT-22..CT-39): a scheduled task only sends at its time when the worker runs
its queue every minute. No test pinned that schedule, so removing it or slowing it down kept every test green.

## Context
`tests/config.test.ts` checked only that every scheduled queue has a handler, not the reverse. `runDueScheduledTasks`
and the routine fires are covered by integration tests; their schedule in `softure.config.ts` was not.

## Constraints
- Test only; no product code change.

## Notes
- Research skipped: the gap and its fix are one assertion in the existing configuration test.
- Frame skipped: part of the owner-ordered pre-release review.

## Done
The configuration test pins the one-minute schedule and the one-at-a-time queue of the routine fires and the scheduled tasks.
