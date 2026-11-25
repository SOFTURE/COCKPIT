# Plan review: recent-fires-as-list

Reviewed: plan.md @ 2026-11-25. Mode: light (one card, one query filter). Verdict: ready.
Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (rows, date, badge colours, Retry, 14-day window all have a step) |
| Verifiability | PASS (unit tests on the boundary, e2e, screenshots looked at) |
| Data and migrations | PASS (read-only filter on an existing column, no migration) |
| Tests | PASS |
| Security | PASS (no new input; Retry is the existing server action) |
| Scope | PASS (broadcast page and inbox keep `IssueWakeStatus`) |

## Findings
- Suggestion: the window must be computed from one `now` passed in, so the SQL filter and any test agree. Accepted:
  `loadProjectRoutines` computes `since` once and `buildRoutinesTab` takes `now` and filters again (pure, tested).
- Suggestion: a queued retry is neither green nor red; give it blue so it does not read as a failure. Accepted.

## Decisions (auto)
- Plan accepted.
