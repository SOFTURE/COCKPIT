# Implementation review: recent-fires-as-list

Reviewed: 528adfb against plan.md. Verdict: approve. Findings: 0 critical, 0 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (`findRecentFires({ limit, since })`, `buildRoutinesTab({ ..., now })` with the 14-day window, `FiredIssueRow` with title, fire time, state badge and Retry; copy in both dictionaries; e2e; CHANGELOG) |
| Correctness | PASS (window inclusive at exactly 14 days; the issue's time is its newest `createdAt`, so a Retry does not move it; a failed fire wins over a fired one) |
| Tests | PASS (window boundary, states, time order, markup colours and Retry, the SQL `since` filter; unit 698/698; e2e routines 2/2) |
| Progress honesty | PASS (screenshots looked at, 1280 and 390, light and dark) |
| Security | PASS (no new input; Retry is the existing server action, extracted as `RetryWakeForm`) |
| Patterns | PASS (bar layout of `StatusActionFoldRow`, `px-2` inset of `row-inset.ts`, theme `Badge`; broadcast page and inbox keep `IssueWakeStatus`) |

## Findings
- Suggestion: the row's bar layout repeats `StatusActionFoldRow`'s grid on a plain `li` (nothing to fold). Kept:
  CT-18 builds the one shared list row and result badge colour map and moves this row onto it.

## Decisions (auto)
- Approved.
