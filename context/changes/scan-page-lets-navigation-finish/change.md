---
change_id: scan-page-lets-navigation-finish
title: "Leaving Scan status works while its page refreshes itself"
status: impl_reviewed
roadmap_item: null
branch: claude/project-thread-iqvmvw
created: 2026-11-26
updated: 2026-11-26
---

## Intent
A person who pressed Scan now can leave Scan status through the sidebar at once, however slow the server answers, and
the page stops refreshing itself once the scan is over.

## Context
`e2e/overview.spec.ts:25` failed on PR #128 (run 45778106613, job 139766631335, step "e2e under load"): after
`scanUntilSettled` the click on Main → Projects left the page on Scan status ("The scan is queued. This page refreshes
until it finishes.") for the whole 5-second wait. The same code was green on master 101210c.

Cause, reproduced locally (built app, Playwright, `/projects` RSC answers delayed by 3 s): the navigation never
finished in 120 s, while it took 140–280 ms without the delay. Two faults in `src/scan/scan-now-button.tsx`:
- It calls `router.refresh()` every 2 s on a fixed interval, whether the previous refresh finished or not. In Next 16
  a refresh is a navigation to the current URL that re-fetches everything; one dispatched while a navigation is in
  flight works from the navigation's target and replaces its pending render. When an answer takes longer than 2 s,
  every refresh replaces the one before, nothing ever commits, and the old page (which owns the timer) stays mounted:
  the person is stuck on Scan status. Under the 4-worker e2e load the `/projects` answer took over 2 s.
- It counts as waiting while `state === "queued"`, and `useActionState` keeps that state for the life of the page, so
  after one press the page refreshes every 2 s forever, even long after the scan ended.

## Constraints
- No retries, no longer timeout, no loosened assertion in the failing spec.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the failing run's log and page snapshot, the Next 16 router sources (`app-router-instance.js`,
  `refresh-reducer.js`) and the local reproduction above are the investigation.
- Frame skipped: a bug a person hits too, with a measured cause.
