---
change_id: bump-softure-packages-2026-11-23
title: "The repository runs on the newest @softure-ai/* packages (skills 0.30.0)"
status: archived
roadmap_item: null
branch: claude/project-thread-bo4m2v
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
Every `@softure-ai/*` package and SOFTURE pin is on its newest published version, as the package-update
routine (`routines/package-updates.md` in `@softure-ai/skills`) requires, run once on demand.

## Context
Owner request in the project (2026-11-23): run the package-update routine now. Comparison against npm on
2026-11-23: only `@softure-ai/skills` moves (0.24.0 → 0.30.0). Every other package (auth 0.2.21, core 0.2.11,
db 0.1.17, jobs 0.1.14, mailing 0.2.8, mcp-access 0.7.8, observability 0.8.8, ops 0.2.6, security 0.2.12,
theme-notion 0.30.0, ui 0.3.11, config 0.1.7, deploy 0.7.8, testing 0.5.2) is already newest. The SOFTURE/AI
workflow pins and `DEPLOY_CLI` in `docker/server/deploy.sh` belong to deploy 0.7.8, which does not move.
No held packages (`routines.packageUpdates.hold` absent).

## Constraints
- Only the package bump, what its installer writes (`package.json`, `package-lock.json`, `.claude/skills/**`,
  `.claude/softure-skills.json`, the managed block of `AGENTS.md`) and `context/state.json`.
- Project rules above the managed block stay untouched.
- No release, tag, publish or deploy.

## Notes
- Research skipped: a dependency bump with no source code; the installer diff is the whole investigation and
  is recorded in plan.md.
- Frame skipped: the outcome follows directly from the owner's request.
- Branch: the session may push only to `claude/project-thread-bo4m2v`, so the routine's
  `claude/bump-softure-<date>` name is not used.
