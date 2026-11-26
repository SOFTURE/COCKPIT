# Plan: scheduled-tasks-store-and-fire

## Approach
A new table `projects.scheduled_tasks` holds each task: title, prompt, the chosen repository keys, the planned
instant (`run_at`), a status (`scheduled` → `sending` → `sent` or `failed`), the run's broadcast id (set by the claim,
before sending), the claim time, the sent time, the projects skipped at fire time and the failure reason. Module
queries (`modules/projects/scheduled-tasks.ts`) do the inserts, the guarded update and delete, and the claim.
`src/scheduled/` validates input (`save-scheduled-task.ts`), runs a claimed task through `sendBroadcast`
(`run-scheduled-task.ts`), drains due tasks (`scheduled-task-handler.ts`, queue `cockpit.scheduled-tasks`, every
minute), deletes (`delete-scheduled-task.ts`) and lists (`load-scheduled-tasks.ts`). Server actions in
`app/(app)/scheduled/actions.ts` (create, update, delete, run now) for CT-37/38.

## Key decisions
- D1 Claim: `UPDATE scheduled_tasks SET status='sending', claimed_at=now, broadcast_id=coalesce(broadcast_id,
  gen_random_uuid()) WHERE id IN (SELECT id ... WHERE (status='scheduled' AND run_at <= now) OR (status='sending' AND
  claimed_at <= staleBefore) ORDER BY run_at LIMIT n FOR UPDATE SKIP LOCKED) RETURNING *`. "Run now" uses the same
  SET with `WHERE id = $1 AND status = 'scheduled'`.
- D2 The broadcast id is kept across takeovers (`coalesce`), so a retried run is the same broadcast: no second issue.
- D3 Stale time `STALE_RUN_MS = STALE_SEND_MS + 60 s` (research, risks).
- D4 Grace: a time up to one minute in the past is accepted (the minute picked is the current one) and fires on the
  next tick; earlier is `scheduled.time_past`. A skipped DST time moves as core defines (02:30 → 03:30).
- D5 Fire-time outcomes: unwatched projects are skipped and stored in `skipped_keys`; none left → `failed`
  (`no_projects`); no forge token → `failed` (`forge_not_configured`); a storage failure or a project unwatched between
  the filter and the send leaves the run `sending` for the stale takeover. Per-project failures stay on the broadcast
  (its page offers the retries); the task is `sent`.
- D6 Edit only while `scheduled`; delete any status but `sending` (a sent task's broadcast stays).
- D7 Authorization: `requireUser()` like every broadcast action (all members may broadcast, FR-16); zod at the boundary.
- D8 The task's creator (id and display name at creation) is the broadcast's sender.
- D9 No FK from `broadcast_id` to `broadcasts`: the id exists before the broadcast row, and deleting a broadcast from
  history must not touch the task.

## Phase 1: Data (TDD)
Migration 0010, schema, `modules/projects/scheduled-tasks.ts`, manifest table list.

## Phase 2: Validation and save (TDD)
`save-scheduled-task.ts`: create and update with every rule; delete.

## Phase 3: Firing (TDD)
`run-scheduled-task.ts`, `scheduled-task-handler.ts`, queue and schedule, `src/jobs/handlers.ts`.

## Phase 4: Actions, messages, gates
`app/(app)/scheduled/actions.ts`, `messages` block `scheduled`, `load-scheduled-tasks.ts`; typecheck, lint, test, build and e2e.

## Merge
PR to master, all CI jobs green, go from the coordinator, merge, master CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Data

#### Automated
- [x] 1.1 Module tests: insert, update only while scheduled, delete refused while sending, claim of due tasks only, stale takeover keeps the broadcast id — e121448 (`tests/projects/scheduled-tasks.test.ts` 7/7)

### Phase 2: Validation and save

#### Automated
- [x] 2.1 Validation tests: empty or over-long title and prompt, no projects, unwatched project, past time, one-minute grace, DST 2026-03-29T02:30 and 2026-10-25T02:30 — e121448 (`tests/scheduled/save-scheduled-task.test.ts` 20/20; 02:30 on 2026-03-29 gives 03:30 CEST, on 2026-10-25 the first 02:30)
- [x] 2.2 Edit of a sent task refused; delete of a sent task keeps its broadcast — e121448 (same file)

### Phase 3: Firing

#### Automated
- [x] 3.1 Due task fires once with marker and prompt; not-yet-due left alone; late task records planned and sent times — e121448 (`tests/scheduled/run-scheduled-task.test.ts` 11/11)
- [x] 3.2 Two concurrent ticks fire once; stale `sending` run taken over without a second issue — e121448 (same file)
- [x] 3.3 Run now fires once; unwatched project skipped and named; routines woken (fake wake) — e121448 (same file; `tests/scheduled/load-scheduled-tasks.test.ts` 2/2)

### Phase 4: Actions, messages, gates

#### Automated
- [x] 4.1 Gates green: typecheck, lint, test — e121448 (unit 866/866)
- [x] 4.2 Build and full e2e green — e121448 (`npm run build && npm run e2e`: 102/102)
