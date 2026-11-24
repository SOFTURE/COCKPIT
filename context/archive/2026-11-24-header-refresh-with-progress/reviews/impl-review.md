# Implementation review: header-refresh-with-progress

Scope: full · Date: 2026-11-24 · Commits: f713be8 · Gates: typecheck ✓ lint ✓ test ✓ (541/541) e2e ✓ (67/67) doctor ✓

## Verdict
Ready. Every screen has a header bar (the trip planner's top bar: a bordered row, the menu button on a phone on its
left). On its right, "Refresh" queues the existing scan (it reuses "Scan now"'s action, so it joins a waiting scan);
while the scan waits or runs the control polls `GET /api/scan-progress` every second, spins its icon, counts "N of M
refreshed" with a progress bar (hidden below `sm`), and reloads the page's data when the scan ends; idle, it shows the
newest project read time. The count is the job progress the scan handler reports through `@softure-ai/jobs`
(`reportProgress`), so no migration and no in-process state.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | one shell component, one route, one pure function, one loader, own message keys |
| Progress honesty | PASS | unit tests ran red (module missing, no progress callback) before the code existed |
| Correctness | PASS | the route answered `queued` → `running 0 of 5` → `idle` during a real scan in the e2e build; screenshots before/after, light/dark, 1280 and 390 inspected |
| Tests | PASS | progress 0..N with a failing project; idle / queued / running with and without a count / other step / no reads; e2e on a production build |
| Security | PASS | the route answers 401 without a session (and the proxy guards it); the button's action calls `requireUser` |

## Findings
- Warning: the jobs package writes progress at most once a second, so a scan faster than that (the e2e's fake forge)
  jumps from "0 of 5" to the read time. A real scan reads each project in about a second or more, so the count
  advances. Accepted (recorded in the plan review).
- Suggestion: the status line is `aria-live="polite"` without `role="status"`, so the many specs that read the page's
  first `status` keep reading the page's own message. Kept.

## Decisions (auto)
- The header's refresh group is named ("Refresh of every project") so tests and screen readers find it; a `<header>`
  inside `<main>` is not a landmark.
- On a phone the progress bar is hidden and the counter text stays, so the bar never pushes the button off screen.
