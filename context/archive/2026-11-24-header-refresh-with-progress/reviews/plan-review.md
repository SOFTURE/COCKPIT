# Plan review: header-refresh-with-progress

Reviewed: plan.md @ 2026-11-24. Mode: light (one shell component, one route, one pure function). Verdict: ready.
Findings: 0 critical, 2 warnings, 1 suggestion.
Grounding: 9/9 paths, 4/4 commands

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (header bar, button, live counter, progress bar, last read time, reload at the end) |
| Verifiability | PASS (unit tests, e2e on a production build, inspected screenshots) |
| Data and migrations | PASS (none: progress lives on the job row the jobs package already has) |
| Tests | PASS |
| Security | PASS (the route checks the signed-in user; the action already calls `requireUser`) |
| Scope | PASS |

## Findings
- Warning: the jobs package throttles progress to one write a second, so the last "N of N" may never be written
  before the job ends; the control then jumps from "N-1 of N" to idle. Accepted: idle shows the fresh read time right
  after, and the reload brings the new data.
- Warning: the layout reads the scan queue on every request; one indexed query on the jobs table next to the inbox and
  overview reads it already does. Accepted.
- Suggestion: the e2e must not race with the other specs' scans (shared database): assert on a state the run reaches
  for sure ("Last read" after the scan, the button enabled again), not on a specific counter value. Accepted.

## Decisions (auto)
- The header's refresh scans the projects; Settings' "Refresh list" keeps rereading the token's repository list.
