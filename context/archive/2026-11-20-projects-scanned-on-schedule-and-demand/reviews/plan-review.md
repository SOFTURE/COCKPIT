# Plan review: projects-scanned-on-schedule-and-demand

Reviewed: plan.md @ 2026-11-23. Mode: full. Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.
Grounding: `jobs`, `runScheduleNow`, `getQueueStats`, `runDueJobs`, `runJobWorkerProcess`, `authJobSchedules`,
`securityJobSchedules` exist in the installed versions (jobs 0.1.14, auth 0.2.21, security 0.2.12).

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS: schedule, Scan now, last read, failure reason, isolation of failures, limit |
| Slicing | PASS |
| Verifiability | PASS |
| Data and migrations | PASS: one forward migration; reads cascade with their repository |
| Tests | PASS after W1 |
| Security | PASS: the Scan now action checks `requireUser`; reads only |
| Lean | PASS |
| Fit | PASS |
| Scope | PASS |
| Reuse | PASS: jobs schedule and worker, no local cron |
| Lessons | PASS (none recorded) |
| Progress format | PASS |

## Findings
- W1 (warning): FR-3 "even with several running instances". Decision (auto): accepted; the schedule's once-per-period
  guarantee belongs to `@softure-ai/jobs` (its own suite); `tests/scan/schedule.test.ts` runs `runDueJobs` twice in
  one period and asserts one scan.
- S1 (suggestion): FR-3 "within 10 seconds". Decision (auto): the worker polls every second; the e2e asserts the read
  appears within 10 seconds of pressing Scan now.

## Decisions (auto)
- Plan accepted with W1 and S1 folded into 1.3 and 2.1.
