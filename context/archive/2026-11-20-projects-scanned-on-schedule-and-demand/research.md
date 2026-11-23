# Research: projects-scanned-on-schedule-and-demand

Input: change.md, roadmap CMP-3, PRD FR-3, NFR-2, NFR-7, the READMEs of `@softure-ai/jobs` 0.1.14 and
`@softure-ai/core` (requestJson), the state schema of `@softure-ai/skills` 0.24.0
(`skills/softure-doctor/references/state.schema.json`). Depth: normal.
Snapshot: CMP-2 branch (e0fca45), 2026-11-23.

## Summary
CMP-2 left a `projects.repositories` table and a read-only forge client. The scan is a `@softure-ai/jobs` schedule:
one queue, `every: "<n>m"`, run once per period however many workers run, and `runScheduleNow` for "Scan now". The
handler reads each watched repository's `context/state.json` and its `owner-word` issues, validates the state against
schema version 2, and stores the latest read per project. Nothing in the repository runs a worker yet: CMP-3 adds
`scripts/worker.ts` (`runJobWorkerProcess`), which the e2e starts next to the app.

## Current state
- `modules/projects`: table `repositories` (key, full name, default branch, has_state, missing permissions).
- `src/forge/client.ts`: `getRepository`, `probe`; no file or list reads yet.
- `@softure-ai/jobs` 0.1.14 is installed (dependency) but not configured.

## Findings
- **Schedule** (jobs README §3 "Schedules"): `schedules.<queue>.every` from `1m` to `7d`, aligned to UTC; once per
  period via a conditional upsert; missed periods collapse into one run; the dedup key `schedule` joins a pending run.
  `runScheduleNow(ctx, queue)` enqueues a manual run that joins a pending one. `getQueueStats(ctx)` gives
  `schedule.lastSucceededAt`, `isFailing`, `lastFailureCode` and the pending count for the status screen.
- **Rate limits** (FR-3, NFR-2): `retryJobLater(code, seconds)` re-runs the job after the forge's `Retry-After` (429)
  or after `x-ratelimit-reset` when `x-ratelimit-remaining` runs low; one project's failure is recorded on that
  project and the loop goes on.
- **Reading the state:** `GET /repos/{o}/{r}/contents/context/state.json?ref=<branch>` with
  `Accept: application/vnd.github.raw+json` answers the file itself, so `requestJson` parses it directly.
- **Owner-word issues:** `GET /repos/{o}/{r}/issues?labels=owner-word&state=all&per_page=100`, paged with the `Link`
  header (`parseLinkHeader`). Stored with number, state, title, body, URL and times for CMP-4 and CMP-5.
- **State contract:** version 2 requires `schema_version`, `project`, `mode`, `main_branch`, `updated_at`,
  `active_roadmap`, `queued`, `open_changes`, `owner_queue` (entries with `id`, `kind`, `source`, `item`, `since`,
  `text`) and `last_release`. A version 1 file is "state too old" with the step `npx softure-skills state`.
- **Package prune schedules:** `authJobSchedules` and `securityJobSchedules` (with their handlers) come for free once
  the jobs module runs.

## Unknowns answered
- *One stored document per project and scan, or only the latest?* Only the latest read per project, plus the last
  good state: the screens show the current state and the time of the last good read (FR-3); the history of what
  shipped comes from the forge (CMP-10), so a row per scan would grow without a reader. 30 projects × one document of a
  few KB stays small.

## Modules (SOFTURE first)
Adopted: jobs (schedule, worker, retry, stats), core (`requestJson`, `parseLinkHeader`), auth and security prune
schedules. Built here: the state reader and the scan handler (COCKPIT-specific). No gap.

## Risks
- A worker must run in production next to the app; CMP-8 (deploy) adds the worker service (`@softure-ai/deploy`
  writes it when it sees `@softure-ai/jobs`).
