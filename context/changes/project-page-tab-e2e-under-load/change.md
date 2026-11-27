---
change_id: project-page-tab-e2e-under-load
title: "The project page e2e opens its tabs reliably under the four-worker load"
status: implemented
roadmap_item: null
branch: claude/project-thread-zhf4e8
created: 2026-11-27
updated: 2026-11-27
---

## Intent
`e2e/project-page.spec.ts` passes every run, with 2 and 4 workers, also while other specs scan the shared database
(SOFTURE/COCKPIT#168).

## Context
"a roadmap opens inside COCKPIT…" failed once in the `e2e under load` step of PR #167's first run
(run 45983348316): after the breadcrumb back to the project page, `openTab(page, "roadmaps")` clicked the tab, and for
5 s the old document stayed with the Waiting tab current (`aria-current` null on Roadmaps, 13 polls). The rerun passed.

## Constraints
- Spec only unless the cause is a product bug; no retries, no loosened assertion, no release.
- Follow the existing pattern for scan refreshes in specs (`e2e/hold-scan-refresh.ts`).

## Notes
- Frame skipped: a flaky e2e is a bug to fix at once (AGENTS.md → CI).
