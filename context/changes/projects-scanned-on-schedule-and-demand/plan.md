# Plan: projects-scanned-on-schedule-and-demand

## Goal
Every watched project's `context/state.json` and its `owner-word` issues are read every 30 minutes (15 to 60,
configurable) and when the owner presses "Scan now"; each project shows when it was last read and why a read failed,
and one failing project never stops the others. Out of scope: the inbox (CMP-4), the overview columns (CMP-6).

## Approach
**Starting point:** the watched repositories exist (CMP-2); no job runs.

**Chosen:** the `@softure-ai/jobs` module with one schedule `cockpit.scan` (`every` from `SCAN_INTERVAL_MINUTES`,
default 30, allowed 15 to 60) plus the auth and security prune schedules; `scripts/worker.ts` runs them; the handler
reads every project in turn and stores the latest read per project in `projects.reads`; a "Scan status" screen shows
each project's last read and failure and offers "Scan now" (`runScheduleNow`).
Rejected: a row per scan (no reader; research); a cron route (the jobs schedule already runs once per period).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Interval setting | `SCAN_INTERVAL_MINUTES` in the environment, checked 15 to 60 at start | a schedule's period is config; the owner sets it once | plan |
| Stored read | one row per project: latest status, last good state and issues, times, failure code | FR-3 last good read; research | research |
| State version 1 | status `state_too_old`, step `npx softure-skills state` | roadmap risk line | roadmap |
| Forge limit | `retryJobLater` after `Retry-After` or `x-ratelimit-reset` when fewer than 100 requests remain | FR-3 "waits and resumes" | PRD |
| Writes | none: every scan request is a GET (asserted in tests) | NFR-7 | PRD |

## Phase 1: State reader and the scan handler
**Discipline:** TDD. **Files:** `src/state/**`, `src/forge/client.ts`, `src/scan/**`, `modules/projects/**`
(migration `0002_create_reads.sql`), `softure.config.ts`, `src/jobs/handlers.ts`, `scripts/worker.ts`,
`package.json`, `.env.example`, `tests/state/**`, `tests/scan/**`.

1. `src/state/state-schema.ts`: zod schema of `context/state.json` version 2; `parseProjectState(unknown)` →
   `ok | state_too_old | state_invalid`.
2. Forge client: `getJsonFile(owner, name, path, ref)` (raw JSON), `listOwnerWordIssues(owner, name)` (paged), the
   rate-limit headers.
3. `src/scan/scan-projects.ts`: `scanProjects({ db, client, clock })` reads every watched repository, stores each
   read, never stops on one failure, and answers `retry_later` when the forge limit is near.
4. Jobs: `jobs({ schedules: { "cockpit.scan": { every }, ...authJobSchedules, ...securityJobSchedules } })`,
   handlers, `scripts/worker.ts`, `npm run worker`.

**Tests:** `tests/state/state-schema.test.ts` (v2 ok, v1 too old, invalid); `tests/scan/scan-projects.test.ts`
(three fictional projects, one failing: two read, one failure with its reason; rate limit answers retry later; only
GETs); `tests/scan/schedule.test.ts` (`runDueJobs` runs the scan once per period and `runScheduleNow` adds a run).

**Done when:**
- Automated: the tests above pass; Gates green (typecheck, lint, test).

## Phase 2: Scan status screen and Scan now
**Discipline:** test-after. **Files:** `app/(app)/scan-status/**`, `app/(app)/settings/page.tsx`, `src/scan/**`,
`messages/en.ts`, `e2e/**`, `playwright.config.ts`, `README.md`.

1. `app/(app)/scan-status/page.tsx`: the schedule (interval, last run, failing), one row per project (status word and
   icon, last read, last good read, the failure reason) and a "Scan now" button (server action behind
   `requireUser()`, `runScheduleNow`).
2. Settings links to the scan status.
3. e2e: the worker runs next to the app; the fake forge serves state files and issues.

**Tests:** e2e `e2e/scan.spec.ts`: add two fictional projects (one readable, one whose state is invalid), press Scan
now, see one read with its time and one failure with its reason.

**Done when:**
- Automated: the e2e passes; Gates green (typecheck, lint, test).
- Manual: the scan status screen renders on the theme in light and dark at 390 px (evidence: Playwright screenshots
  the run inspects).

## Risks and rollback
- The worker is a second process; without it nothing scans → the scan status screen shows "never ran" and the e2e
  starts it; CMP-8 deploys it.
- Rollback: revert the merge; drop `projects.reads` per its Rollback comment.

## Decisions (auto)
- Projects are read one after another (30 projects × ~3 requests stays far under NFR-2's two minutes and limit).
- The scan also refreshes `has_state` on the repository row, so Settings stays true.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: State reader and the scan handler

#### Automated
- [ ] 1.1 `tests/state/state-schema.test.ts` passes: version 2 read, version 1 too old, invalid refused
- [ ] 1.2 `tests/scan/scan-projects.test.ts` passes: three projects, one failing, two read; limit waits; only GETs
- [ ] 1.3 `tests/scan/schedule.test.ts` passes: one run per period, Scan now adds a run
- [ ] 1.4 Gates green (typecheck, lint, test)

### Phase 2: Scan status screen and Scan now

#### Automated
- [ ] 2.1 `e2e/scan.spec.ts` passes: Scan now reads one project and shows the other's failure reason
- [ ] 2.2 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.3 The scan status screen renders on the theme in light and dark at 390 px (evidence: Playwright screenshots the run inspects)
