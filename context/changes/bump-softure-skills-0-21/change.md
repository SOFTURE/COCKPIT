---
change_id: bump-softure-skills-0-21
title: "The repository runs on @softure-ai/skills 0.21.0 with its refreshed skills and AGENTS.md block"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-4e4cb8
created: 2026-11-20
updated: 2026-11-20
---

## Intent
The project uses the latest published `@softure-ai/skills` (0.21.0), so agents work from the current
skills and the current managed SOFTURE block in `AGENTS.md`.

## Context
Owner request in the project chat: bump the skills package. The repository runs on 0.20.0 (PR #1,
merge e56a5d6). npm lists 0.21.0 as the newest version.

## Constraints
- Only the package bump and what its installer writes: `package.json`, `package-lock.json`,
  `.claude/skills/**`, `.claude/softure-skills.json`, the managed block of `AGENTS.md`.
- Project rules above the managed block stay untouched.
- No release, tag, publish or deploy.

## Notes
- Research skipped: a dependency bump with no source code; the installer output and the diff are the
  whole investigation and are recorded in plan.md.
- Frame skipped: the owner named the outcome directly.
