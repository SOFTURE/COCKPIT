# Research: scheduled-task-repeat

Read at master 23f62d7 (CT-36..CT-38 merged).

## How it works today
- `projects.scheduled_tasks` (migration 0010): one row is one task and one run. `status` moves
  `scheduled → sending → sent | failed`; the claim (`claimDueScheduledTasks`, one UPDATE over rows locked with
  `FOR UPDATE SKIP LOCKED`) stores the run's `broadcast_id` before anything is sent, a takeover after
  `STALE_RUN_MS` resends the same broadcast, whose per-project sends and marker never make a second issue.
- `runClaimedTask` (`src/scheduled/run-scheduled-task.ts`) sends the claimed task through `sendBroadcast` and records
  `sent`/`failed` guarded by `claimed_at`. "Run now" claims the one task whatever its time.
- The page (`app/(app)/scheduled/page.tsx`) lists `scheduled`/`sending` rows under Scheduled and `sent`/`failed`
  rows under Done (`loadScheduledTasks`, `buildScheduledRow`, `buildDoneRow`). The row menu
  (`scheduled-row-menu.tsx`) holds Edit, Run now, then Delete after the separator.
- The dialog (`scheduled-task-dialog.tsx`) posts `taskId`, `title`, `prompt`, `runAt` (`YYYY-MM-DDTHH:mm`) and
  `project`; `save-scheduled-task.ts` checks and stores them.
- Time helpers: `@softure-ai/core` 0.2.11 `getWallClock`, `getZonedInstant` (a skipped DST hour moves forward, a
  repeated one takes its first occurrence), `addCalendarDays`, `calendarDaysBetween`, `toCalendarDay`.
- `Queryable.transaction` exists and is used by `reads.ts` and `routines.ts`; PGlite (tests, e2e) runs it.
- theme-notion 0.37.0 has `RadioGroup`/`RadioGroupItem` (16 px dot, no label or touch size of its own).

## What the change touches
- Data: each run must stay a Done row while the task stays scheduled, and a run must fire once per planned time.
- Firing: the next time is computed when a run is claimed.
- UI: dialog (repeat choice), Scheduled row (repeat word, Paused badge), menu (Pause/Resume).

## Options for the data
1. A separate runs table (task, planned time, broadcast, status…): the task row loses its run columns; every reader
   (claim, finish, page, delete, tests of CT-36..CT-38) changes.
2. **A series of occurrence rows (chosen).** Each row stays one planned run exactly as today; rows of one repeating
   task share a `series_id`. When a repeating occurrence is claimed (`scheduled → sending`), the same transaction
   inserts the series' next occurrence. `UNIQUE (series_id, run_at)` is the roadmap's "(task, planned time) run key",
   and a partial `UNIQUE (series_id) WHERE status = 'scheduled'` keeps one upcoming occurrence per series. Claim,
   finish, Done rows, broadcasts and their tests stay as they are; a Done row keeps exactly what that run sent.

## Risks
- Two spawns for one claim: only the `scheduled → sending` transition spawns (a takeover of a stale `sending` row
  does not), inside the claim's transaction, with `ON CONFLICT DO NOTHING` on both unique indexes.
- A missed period (worker down for weeks): the next time is the first period point after both the planned time and
  now, so the series fires once and moves on.
- "Run now" on a repeating task must not eat the next planned run: it sends a copy (its own row, `repeat = 'none'`,
  claimed at insert) and leaves the occurrence as it is.
- A planned time inside the hour a spring DST change skips moves an hour later on that day and keeps that wall clock
  afterwards (core's rule); 08:00 is never affected.

## SOFTURE modules
- core's local date-time helpers cover the next time; jobs' schedule stays the one-minute tick. Nothing missing.

## Notes
- Frame skipped: the owner's explicit feature, split in the roadmap.
