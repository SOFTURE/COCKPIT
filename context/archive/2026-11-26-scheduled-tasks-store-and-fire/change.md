---
change_id: scheduled-tasks-store-and-fire
title: "Scheduled tasks stored and fired on time"
status: archived
roadmap_item: CT-36
created: 2026-11-26
branch: claude/project-thread-77jc3z
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
COCKPIT stores scheduled tasks (a title, a prompt, a local date and time in the app's time zone, and the watched projects to send to) and, once a task's time has come, sends it exactly once as a broadcast: one cockpit issue per chosen project with the prompt as its body, each project's routines woken as for any broadcast (CT-10). The run is recorded on the task (planned time, sent time, the broadcast it became), so its per-project result and retries live on the existing Broadcast detail page. No screen yet: the server actions (create, update, delete, run now) and the worker queue.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-36: Scheduled tasks stored and fired on time
- **Change ID:** `scheduled-tasks-store-and-fire`
- **Status:** ready
- **Outcome:** COCKPIT stores scheduled tasks (a title, a prompt, a local date and time in the app's time zone, and the
  watched projects to send to) and, once a task's time has come, sends it exactly once as a broadcast: one cockpit
  issue per chosen project with the prompt as its body, each project's routines woken as for any broadcast (CT-10).
  The run is recorded on the task (planned time, sent time, the broadcast it became), so its per-project result and
  retries live on the existing Broadcast detail page. No screen yet: the server actions (create, update, delete, run
  now) and the worker queue.
- **Prerequisites:** —
- **Touches (estimate):** `modules/projects/migrations/0010_create_scheduled_tasks.sql` (new),
  `modules/projects/schema.ts`, `modules/projects/scheduled-tasks.ts` (new; queries and the conditional claim),
  `src/scheduled/**` (new: `save-scheduled-task.ts`, `delete-scheduled-task.ts`, `run-scheduled-task.ts`,
  `scheduled-task-queue.ts`, `scheduled-task-handler.ts`, `load-scheduled-tasks.ts`), `app/(app)/scheduled/actions.ts`
  (new), `src/jobs/handlers.ts`, `softure.config.ts` (queue and its `every: "1m"` schedule), `src/broadcast/send-broadcast.ts`
  (only if the send needs an extra input; its contract stays), `messages/en.ts` and `messages/pl.ts` (own block: error
  messages), `tests/scheduled/**`, `tests/modules/**`.
- **Size:** M
- **Rules:**
  - A task's time is entered as a `LocalDateTime` (`YYYY-MM-DDTHH:mm`) in `config.timezone` and stored as the instant
    from core's `getLocalDateTimeInstant`; a time not in the future (one minute of grace) is refused on create and edit.
  - Title and prompt use the broadcast limits (`src/broadcast/broadcast-limits.ts`); at least one project; every
    project must be watched at save time. A project unwatched later is skipped at fire time and named in the run.
  - Firing: the queue `cockpit.scheduled-tasks` runs every minute; it claims due tasks with one conditional `UPDATE`
    (`status = 'scheduled' AND run_at <= now`, `FOR UPDATE SKIP LOCKED`), so two workers or two ticks never fire a
    task twice; the send is `sendBroadcast` with the run's own broadcast id stored before sending, so a crashed or
    retried send never makes a second issue (the broadcast marker). A run still `sending` after `STALE_SEND_MS` is
    taken over by the next tick.
  - A task whose time passed while the worker was down fires on the next tick and records both times (planned and
    sent); nothing is dropped silently.
  - "Run now" sends a scheduled task at once through the same claim and send.
  - Only a `scheduled` task can be edited; delete removes a scheduled task, or a sent task's entry (the broadcast and
    its issues stay in Broadcast history).
  - Every action checks the signed-in member's authorization, not only a session; input is narrowed with zod.
- **Unknowns:**
  - Whether `sendBroadcast` can be called from the worker as is (it takes `db`, `client`, `clock`, `wake`); recommended:
    yes, through the same `getForgeClient` and `getWakeDependencies` the fire handler uses. (owner: research; blocks: no)
- **Risk:** a double fire would spend the owner's token budget twice; the claim and the broadcast id are the two
  guards and both are tested.
- **Baseline:** today a broadcast is sent only when the owner presses Send; after: a stored task sends itself at its
  time.
- **Layout:** no screen in this item.
- **Verification:** unit tests: validation (empty title or prompt, over-long, no projects, an unwatched project, a past
  time, the one-minute grace, a local time on a DST change day in Europe/Warsaw: 2026-03-29T02:30 refused or moved as
  core defines, 2026-10-25T02:30 the first instant). Integration tests on PGlite with a fake clock and a fake forge:
  a due task fires once and its issues carry the marker and the prompt; two concurrent ticks fire it once; a stale
  `sending` run is taken over without a second issue; a not-yet-due task is left alone; "Run now" fires once; edit of
  a sent task is refused; delete of a sent task keeps its broadcast; the routines of each project are woken (fake wake).
  e2e: the existing suites stay green (no screen yet). All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-8, NFR-5, NFR-7
- **Input:** context/changes/scheduled-tasks-store-and-fire/change.md

Findings gathered while recording it (master b92aa7d):
- Owner, 2026-11-26 10:46Z (F-8, translated): scheduled tasks: set the date when a prompt fires as an issue in the
  chosen repositories (example: a code-quality check across chosen projects on Monday after the token allowance
  resets, run by itself); a separate tab in the left menu, by the app's existing standard (tabs, a dialog).
- `src/broadcast/send-broadcast.ts` turns one message into one cockpit issue per project, claims each send in the database and looks for the marker before creating, and wakes the project's routines (`wakeAfterIssue`); a scheduled run reuses it with its own broadcast id.
- `softure.config.ts` registers queues and schedules through `jobs({ queues, schedules })`; `cockpit.routine-fires` runs `every: "1m"` and its handler sits in `src/jobs/handlers.ts`.
- `@softure-ai/core` exports `localDateTimeSchema` and `getLocalDateTimeInstant(value, timeZone)`; the app's zone is `config.timezone` (`APP_TIMEZONE`, default Europe/Warsaw).
- The last migration is `modules/projects/migrations/0009_create_project_groups.sql`.

## Constraints
- Owns exclusively (lane L): `modules/projects/migrations/0010_*`, `modules/projects/scheduled-tasks.ts`, `src/scheduled/**`, `app/(app)/scheduled/actions.ts`; edits `src/jobs/handlers.ts`, the queue lines of `softure.config.ts` and its own block of `modules/projects/schema.ts`.
- Starts now.
- The roadmap's binding layout rule for CT-37..CT-39 (section "Slices").
- Build on the `@softure-ai/*` packages (AGENTS.md "SOFTURE packages first"); a missing piece becomes an issue in
  SOFTURE/AI right away, never a local wrapper or override.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts` (each item adds its own block); on a phone controls are at least 44 px.
- COCKPIT's only write to watched repositories stays the cockpit issue (AGENTS.md "Access to watched repositories").
- Fixtures, screenshots and test data are fictional (AGENTS.md "Open source and generic").
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- Frame skipped: the owner's explicit feature, with the split recorded in the roadmap.

## Decisions (auto)
- The claim is one `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED)` that also sets the run's broadcast id
  (`coalesce(broadcast_id, gen_random_uuid())`), so a takeover resends the same broadcast.
- A run left `sending` is taken over after `STALE_RUN_MS` = `STALE_SEND_MS` + 1 min, so every project send of a dead
  run is stale too.
- A time up to one minute in the past is accepted (the current minute) and fires on the next tick; a skipped DST time
  moves as core defines (2026-03-29T02:30 → 03:30 CEST), a repeated one takes its first occurrence.
- At fire time unwatched projects are skipped and stored on the task; no project left or no forge token makes the run
  `failed` with its reason; per-project failures stay on the broadcast with its retries.
- Edit only while `scheduled`; delete any status except `sending`; the broadcast and issues stay.
- Every action uses `requireUser()` like the broadcast actions (every member may broadcast, FR-16).
- `broadcast_id` has no foreign key: it exists before its broadcast, and deleting a broadcast leaves the task's entry.

## Done
- Migration `projects/0010` (`scheduled_tasks`), `modules/projects/scheduled-tasks.ts` (insert, guarded edit and
  delete, the claim of due tasks and of one task now, the run records), `src/scheduled/**` (validation in the app's
  zone, the run through `sendBroadcast`, the `cockpit.scheduled-tasks` queue every minute, the list for CT-37), the
  server actions in `app/(app)/scheduled/actions.ts` (create, edit, delete, run now) and the `scheduled` message block.
