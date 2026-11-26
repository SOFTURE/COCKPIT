# Research: scheduled-tasks-store-and-fire

## How it works today (master ade2f22)
- `src/broadcast/send-broadcast.ts` `sendBroadcast({ db, client, clock, id, title, body, repositoryKeys, sentBy, sentByName, wake })`
  validates the text (normalised title, trimmed body, `broadcast-limits.ts`), refuses an unwatched key
  (`broadcast.project_not_watched`), stores the broadcast with `saveBroadcast` (insert on conflict do nothing: the same
  id is the same broadcast), then claims one `broadcast_sends` row per project (unique index) and looks for the
  broadcast's marker before creating an issue on a takeover or a lost answer. Each sent issue wakes the project's
  routines through `wakeAfterIssue`. A send left `creating` for `STALE_SEND_MS` (10 min) is taken over.
- Worker: `softure.config.ts` registers queues and schedules with `jobs({ queues, schedules })`;
  `cockpit.routine-fires` runs `every: "1m"`; its handler (`src/routines/fire-handler.ts`) is a `defineJobHandler`
  with an empty payload, wired in `src/jobs/handlers.ts` through `getWakeDependencies()`; the scan handler takes
  `getForgeClient()`.
- `modules/projects/routines.ts` `findDueFires` reads due rows by status and time; it uses no row lock (fires are
  claimed one by one afterwards). Broadcast sends rely on a unique index plus a conditional update (`takeOverSend`).
- Actions: `app/(app)/broadcast/actions.ts` calls `requireUser()` (every member may broadcast, FR-16), narrows the
  form with zod and maps `broadcast.*` codes to `messages.broadcast.errors`.
- `@softure-ai/core`: `localDateTimeSchema` and `getLocalDateTimeInstant(value, zone)`; a skipped local time
  (2026-03-29T02:30 in Europe/Warsaw) gives the instant the same distance after the change (03:30 local), a repeated
  one (2026-10-25T02:30) its first occurrence. `config.timezone` is the app's zone.
- Tests: `tests/support/test-context.ts` (migrated PGlite + test clock), `tests/support/memory-forge.ts` (fake forge
  with issues and the cockpit label), `tests/routines/fake-routines-api.ts` (fake routine providers).
- The projects module lists its tables in the manifest (`modules/projects/index.ts`); the last migration is 0009.

## Answers to the unknowns
- `sendBroadcast` can be called from the worker as is: it needs only `db`, `client` (`getForgeClient()`), a clock
  and optional `wake` (`getWakeDependencies()`), exactly what the fire and scan handlers already build. Its contract
  stays unchanged.

## Risks
- Double fire: guarded by the claim (one conditional `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED)`)
  and by the run's broadcast id stored at the claim, so a takeover resends the same broadcast (sends already `sent`
  are skipped, a lost issue is found by its marker).
- Takeover window: a task taken over at exactly `STALE_SEND_MS` could find a project send still under
  `STALE_SEND_MS` ("in progress") and be marked sent with that send still `creating`; the task's own stale time is
  therefore `STALE_SEND_MS` plus one minute, so every send of a dead run is stale too.
- `gen_random_uuid()` is core Postgres since 13 and available in PGlite.

## SOFTURE modules
- `@softure-ai/jobs` (queue and schedule), `@softure-ai/core` (local date-time, clock, results), `@softure-ai/auth`
  (`requireUser`). Nothing missing.
