---
change_id: stabilise-master-e2e
title: "The e2e on master is green every run, and a red check blocks a merge"
status: archived
roadmap_item: null
branch: claude/project-thread-6qm0oq
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
The `ci` workflow on master passes every run, not by luck: the `e2e` job stops failing at random, the one real bug
behind it is fixed, and master accepts only pull requests whose checks are green.

## Context
Four of the last five pushes to master failed `ci` in the `e2e` job, each time with one test, while the same commits
were green on their pull requests (#47, #49, #50, #51). The failures rotate:
- `scan.spec.ts`: a project added just before "Scan now" stays "Not read yet". A press of Scan now and the scan queued
  by adding a repository join a scan that is already running (`runScheduleNow` in `@softure-ai/jobs` dedups on
  pending *and* running jobs), and that scan listed the watched repositories before the spec added its own. Every
  spec that adds repositories and presses Scan now carries the same race; the specs share one database and scan in
  parallel.
- `cli.spec.ts` (read time): another spec's scan re-reads `example-org/terminal-app` between the CLI's run and the
  screen, so `Read 9:27 PM` vs `Read 9:28 PM`.
- `cli.spec.ts` (exit code 1): reproduced under load: `answered get_overview with data this CLI cannot read`. The
  CLI's answer schema lists three broken reasons and misses `unhealthy` (FR-17): as soon as any watched project is
  unhealthy, `cockpit overview` refuses the whole answer. A real product bug, hit in the e2e whenever `health.spec.ts`
  scanned first.
- master has no branch protection: nothing requires a check to pass before a merge.

## Constraints
- No release, tag, publish or deploy.
- No retries in the Playwright config, no loosened assertion beyond the moving read time, no skipped test.
- The jobs dedup is a package gap: filed in SOFTURE/AI, not worked around in the app.

## Notes
- Research skipped: the failing runs' logs (45259384580, 45266283736, 45312658639, 45346966429) and a local run with
  6 workers that reproduced both `cli.spec.ts` failures are the investigation; recorded above.
- Frame skipped: the outcome (green master, checks required) is the owner's order.

## Owner steps
- **Owner step:** in Settings → Branches of the repository, protect `master`: require the status checks `gates`,
  `e2e`, `deploy-dry-run`, `cli-package` and `context-doctor`, include administrators, block force pushes and
  deletion (the session's proxy refuses agents the branch protection API).
