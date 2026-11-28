---
change_id: bump-softure-packages-2026-11-28
title: "The app runs on the newest @softure-ai packages (2026-11-28)"
status: archived
roadmap_item: null
branch: claude/project-thread-bfopsh
created: 2026-11-28
updated: 2026-11-28
archived_at: 2026-11-28
---

## Intent
Every `@softure-ai/*` package is on its newest published version, as the package-update routine
(`routines/package-updates.md`) describes.

## Context
Two packages move: `@softure-ai/mcp-access` 0.7.9 → 0.7.10 and `@softure-ai/theme-notion` 0.41.1 → 0.42.0. The rest
are current (auth 0.2.24, core 0.2.11, db 0.1.17, jobs 0.1.15, mailing 0.3.0, observability 0.8.8, ops 0.2.6,
security 0.2.12, theme-kit 0.1.10, ui 0.3.11, config 0.1.7, deploy 0.7.10, skills 0.41.2, testing 0.6.0). No held
packages, no owner steps (`routines.packageUpdates` absent), no open package-update pull request.

What the release notes ask of this app:
- mcp-access 0.7.10: the identity carries `via` and `clientName`. The migration applies only to an app that calls
  `findTokenClientName` or reads the package's tables to record who ordered a write; this app does neither, so
  nothing changes. The package's migrations are unchanged.
- theme-notion 0.42.0: new `TableSortHead`/`sortRows` and `TableViewSettings`, both optional. Adopting them would be
  an app-wide UI rollout, which the owner's standing order sends to roadmap items of their own.

## Constraints
- No release, tag, publish or deploy: the bump rides the next release the owner orders.
- No change to SOFTURE code; no loosened test, guard or hook.

## Notes
- Research skipped: the two changelogs, a search for `findTokenClientName`/`clientName` (no hits) and the gates after
  the install are the whole investigation.
- Frame skipped: the outcome is fixed by the routine.
- Branch: the session may push only to `claude/project-thread-bfopsh`, so the routine's `claude/bump-softure-<date>`
  name is not used.

## Decisions (auto)
- `TableSortHead` and `TableViewSettings` are not adopted here (app-wide UI rollout = separate roadmap items).
- The local e2e ran with `PLAYWRIGHT_BROWSERS_PATH` pointed at the container's preinstalled shell (the container
  ships build 1243, the pinned Playwright asks for 1255); an environment detail only, nothing in the repository.

## Done
Both packages bumped with no code change; gates and the full e2e green. No owner step.
