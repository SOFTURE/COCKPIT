# Implementation review: entries-keyed-by-project-and-id

Reviewed: branch claude/project-thread-0gms1g @ 80e200e against plan.md. Verdict: approve.
Findings: 0 critical, 0 warning, 0 suggestion.

## Plan drift
None. Every test the plan names exists; the only code change is the one research predicted.

## Checks
| Check | Result |
| --- | --- |
| Correctness | `data-entry` is `<projectKey>:<id>`, the inbox page's own React key; nothing selects on it (search over `e2e/**`, `src/**`, `app/**`) |
| Tests | two fictional projects with one id on every path: answers rule on PGlite with one memory forge per project, `buildInbox` rows, marker issues and history, `compareSnapshots`, `toEntryAnswerRequest`, row markup |
| Progress honesty | 1.1 to 1.3 ticked with commit 80e200e and the gate result |
| Migrations | none |
| Security | no new input; read-only toward watched repositories unchanged |
| Language | English in code and tests; the pre-commit language scan passed |

## Decisions (auto)
- Approved; the change ends `done_code (waiting: release)` because the row markup ships with the next release.
