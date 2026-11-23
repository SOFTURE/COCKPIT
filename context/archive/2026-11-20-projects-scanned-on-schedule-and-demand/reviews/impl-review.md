# Implementation review: projects-scanned-on-schedule-and-demand

Scope: full · Date: 2026-11-23 · Commits: ee6f27e, aa49d90 · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓ (50); integration: build ✓, e2e ✓ (12); `npx softure-skills doctor` ✓

## Verdict
Ready. The scan is a `@softure-ai/jobs` schedule (`cockpit.scan`, every `SCAN_INTERVAL_MINUTES`), the handler reads
every watched project in turn, stores the latest read with the last good state and issues, and asks to run later
when the forge's budget runs low. "Scan now" queues a run through `runScheduleNow`; the screen refreshes while it
runs. Every scan request is a GET (asserted).

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | W1: the worker also runs inside the app process on PGlite stacks |
| Scope | PASS | |
| Progress honesty | PASS | each item re-run before ticking; 2.3 settled by screenshots the run inspected |
| Correctness | PASS | S1 |
| Tests | PASS | state contract, three projects with one failing, limit, Retry-After, once per period, Scan now, e2e |
| Data and migrations | PASS | `projects.reads` with checks and a cascade; one forward migration with Rollback |
| Security | PASS | Scan now checks `requireUser`; no write toward watched repositories |
| Architecture and patterns | PASS | jobs schedule and worker from the package; no local cron |
| Lessons | PASS | no lessons recorded yet |

## Findings
- W1 (warning): PGlite allows one instance per directory, so a separate worker process cannot share the dev or e2e
  database. Decision (auto): `JOBS_IN_APP_PROCESS=true` starts `runJobWorker` from `instrumentation.ts` in the app's
  own process on those stacks; production on Postgres runs `npm run worker` (CMP-8 deploys it). Recorded in README.
- S1 (suggestion): the schedule's first run after a start reads an empty project list and counts as the "last scan";
  the per-project rows carry the real read times. Decision (auto): accepted.

## Decisions (auto)
- Build-time prerendering no longer touches the database: the loaders call `connection()` first.
