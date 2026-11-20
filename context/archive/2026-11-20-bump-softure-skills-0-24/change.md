---
change_id: bump-softure-skills-0-24
title: "The repository runs on @softure-ai/skills 0.24.0 with state.json schema 2"
status: archived
roadmap_item: null
branch: claude/project-thread-5tlf70
created: 2026-11-20
updated: 2026-11-20
archived_at: 2026-11-20
---

## Intent
The project uses the latest published `@softure-ai/skills` (0.24.0), which closes SOFTURE/SKILLS#48 and
SOFTURE/SKILLS#49, so the roadmap revision that follows can rely on stable owner-queue ids, the
owner-word entry marker, doctor failure codes on the check run and relative sizes.

## Context
Owner request in the project chat (2026-11-20): the skills issues are released, bump and fold them in.
The repository runs on 0.23.0 (PR #6, merge bbbde45). npm lists 0.24.0 as the newest version.

## Constraints
- Only the package bump, what its installer writes (`package.json`, `package-lock.json`,
  `.claude/skills/**`, `.claude/softure-skills.json`, the managed block of `AGENTS.md`) and the
  regenerated `context/state.json` (schema 2).
- Project rules above the managed block stay untouched.
- No release, tag, publish or deploy. No CI yet (AGENTS.md: CI comes with the stack in CMP-1).

## Notes
- Research skipped: a dependency bump with no source code; the installer output, the release notes and
  the diff are the whole investigation and are recorded in plan.md.
- Frame skipped: the outcome follows directly from the owner's request.
