# Plan: release-gap-job-schedules

## Approach
Add one test to `tests/config.test.ts`: the routine-fire and scheduled-task queues run every minute, one job at a time,
and the worker has a handler for each.

## Phase 1: Pin the schedules

- Files: `tests/config.test.ts`.
- Mode: test-after, proven by mutation (the schedule set to 5 minutes, and removed, both fail the test).

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Pin the schedules

#### Automated
- [x] 1.1 The test passes on master and fails with the schedule set to 5 minutes and with it removed — 72b96bf
- [x] 1.2 Gates green: typecheck and lint (pre-commit hook) — 72b96bf
