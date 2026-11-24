---
change_id: header-refresh-own-e2e-server
title: "The header-refresh e2e runs on its own server, so master's e2e under load is green"
status: archived
roadmap_item: null
branch: claude/project-thread-v9mlm0
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
The `ci` job `e2e` on master passes its "e2e under load" step (4 workers) every run: the header-refresh spec (CT-9)
no longer waits for a scan queue that the other specs keep busy.

## Context
Master `ci` run 45404304993 (eb30881, #75) failed in "e2e under load": `e2e/header-refresh.spec.ts` waited 30 s for
the Refresh button to be enabled again, and it stayed disabled. The button is busy while any scan of the queue is
pending or running (`toScanProgress`), which is right for the product. On the shared e2e database the other specs
keep queuing scans (adding a repository, Scan now), so under 4 workers the queue is never idle long enough. A test
design bug, not a product bug.

## Constraints
- No retries, no longer timeouts, no skipped or loosened assertion.
- No product code change.

## Notes
- Research skipped: the failing run's log and `src/shell/refresh-control.tsx`, `src/scan/scan-progress.ts` are the
  investigation, recorded above.
- Frame skipped: the outcome (green master) is the owner's standing order.

## Done
- The header-refresh spec runs in its own Playwright project `refresh` against a fourth app server on its own PGlite
  database (`E2E_REFRESH_PORT`, `E2E_REFRESH_DATABASE_URL`), like the Polish and slow-list servers.
