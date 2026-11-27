---
change_id: packages-help-tooltip-under-load
title: "The packages e2e keeps its help tooltip open under the four-worker load"
status: archived
roadmap_item: null
branch: claude/project-thread-d7u6d7
created: 2026-11-27
updated: 2026-11-27
archived_at: 2026-11-27
---

## Intent
`e2e/packages.spec.ts` passes every run, with 2 and 4 workers, also while other specs scan the shared database
(SOFTURE/COCKPIT#169).

## Context
"the Packages page shows each project's last update, held packages and versions behind npm" failed once in a local
full e2e run with 4 workers: `expectFieldHelp` clicked "Help: No package update yet" and no tooltip was found
(`e2e/field-help.ts:18`, called from `e2e/packages.spec.ts:76`). The 2-worker run of the same tree passed.

## Constraints
- Spec only unless the cause is a product bug; no retries, no loosened assertion, no release.
- Follow the existing pattern for scan refreshes in specs (`e2e/hold-scan-refresh.ts`, as in PR #170).

## Notes
- Frame skipped: a flaky e2e is a bug to fix at once (AGENTS.md → CI); the issue names the failure and its class.

## Done
- Every test of `e2e/packages.spec.ts` holds the header's scan refresh, so a failed refresh at another spec's scan end
  cannot reload the page and drop the open help tooltip.
