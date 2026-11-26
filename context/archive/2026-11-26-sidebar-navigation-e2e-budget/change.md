---
change_id: sidebar-navigation-e2e-budget
title: "E2e specs wait for a sidebar navigation's two server answers"
status: archived
roadmap_item: null
branch: claude/project-thread-az8db4
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
The `ci` job `e2e` is green on master again and stays green under the 4-worker run: specs that open a screen from the
sidebar wait for what that navigation really costs.

## Context
Master CI on 23f62d7 (run 45841440408, step "e2e under load", 4 workers) failed two specs that passed in the first,
2-worker run of the same job:
- `e2e/overview.spec.ts:28`: after `scanUntilSettled`, the click on Main → Projects left the page on Scan status for
  the whole 5-second wait for the Projects heading.
- `e2e/project-groups.spec.ts:62`: test timeout of 30 s (34.0 s); the page snapshot shows the scenario at its end. On
  the green master run before (35ec138) the same test took 10.2 s (2 workers) and 22.1 s (4 workers).

Measured locally (built app, `/projects` RSC answers delayed by Playwright, a second page pressing Scan now every
700 ms so a scan is always pending): the navigation always arrives, in about twice the delay plus one second (1.5 s →
3.96 s, 3 s → 6.44 s, 4.5 s → 9.53 s), with three RSC requests (the page answer, then its dynamic follow-up merged with
one refresh). Sidebar links do not prefetch (no-prefetch.spec), so every sidebar click costs two server answers
(Next 16, see archive `scan-navigation-spec-counts-requests`). Under the 4-worker load an answer over about 2 s
exceeds the 5-second wait. The app is not stuck; the specs gave a two-answer navigation a one-answer budget.

`project-groups.spec.ts:62` is fixed by CT-35 (PR #151, 54613b7: the flow split into serial steps, `holdScanRefresh`);
this change started on top of it and keeps only the navigation part.

## Constraints
- No retries. The bug check that matters (a refresh that replaces the navigation) stays: the helper counts the
  navigation's requests, as scan-status-navigation.spec does.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the failing run's log and page snapshots, the earlier archives on this navigation and the local
  measurement above are the investigation.
- Frame skipped: test budgets that contradict a measured, documented router behaviour.

## Done
- Helper and call sites in 8018ad2; gates (957/957) and full e2e (124/124, 2 and 4 workers) green.
