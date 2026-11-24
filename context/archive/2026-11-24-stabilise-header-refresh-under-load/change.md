---
change_id: stabilise-header-refresh-under-load
title: "The header Refresh e2e passes under the CI's parallel load, and a multi-token scan asks no extra request"
status: archived
roadmap_item: null
branch: claude/project-thread-uk52md
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
`ci` on master is green again: the `e2e` job's "under load" run (`--workers=4`) stops failing in
`e2e/header-refresh.spec.ts`, and the token router (CT-6) reads a repository of the first token's owner with no extra
request, so a scan with several tokens costs what it cost with one.

## Context
- master run 45404304993 (merge of #75, eb30881) failed `e2e` in the load step: `header-refresh.spec.ts` waited 30 s for
  the Refresh button to be enabled again; the failure screenshot shows "14 of 37 refreshed". The spec waits for the
  scan of every watched project in the shared database, and the other specs add projects, so the scan's length grows
  with their count; 30 s is the FR-3 start budget, not a budget for reading 37 projects in turn under 4 workers.
- The same spec failed 1 of 3 load runs on a8a484c (before CT-6), so the race predates CT-6; CT-6's router added one
  metadata read per repository per scan (it picked the token with `getRepository` first), which makes the scan longer.

## Constraints
- No release, tag, publish or deploy. No retries in the Playwright config, no skipped test.
- The FR-3 start budget (30 s) stays as it is; only the time to finish follows the number of projects the scan counts.

## Notes
- Research skipped: the failing run's log and screenshot, and local load runs on eb30881 and a8a484c, are the
  investigation; recorded under Context.
- Frame skipped: the outcome (green master) is the owner's standing order.

## Done
- The header Refresh e2e gives the scan 3 s per counted project to finish (FR-3 start budget unchanged); the token
  router reads with no extra request for a known repository or owner. `npm run e2e -- --workers=4` green 3/3 (db2de03).
