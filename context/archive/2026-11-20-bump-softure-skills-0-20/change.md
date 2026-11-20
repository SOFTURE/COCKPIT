---
change_id: bump-softure-skills-0-20
title: "The repository runs on @softure-ai/skills 0.20.0 with its refreshed skills and AGENTS.md block"
status: archived
roadmap_item: null
branch: claude/project-thread-i7f6j5
created: 2026-11-20
updated: 2026-11-20
archived_at: 2026-11-20
---

## Intent
The project uses the latest published `@softure-ai/skills` (0.20.0), so agents work from the current
skills and the current managed SOFTURE block in `AGENTS.md` before product shaping starts.

## Context
Owner request in the project chat: bump `@softure-ai/skills` to the latest version (0.20.0 or newer)
through a branch and a pull request. The repository was bootstrapped on 0.19.0 (959b05a). npm lists
0.20.0 as the newest version.

## Constraints
- Only the package bump and what its installer writes: `package.json`, `package-lock.json`,
  `.claude/skills/**`, `.claude/softure-skills.json`, the managed block of `AGENTS.md`.
- Project rules above the managed block stay untouched.
- No release, tag, publish or deploy.

## Notes
- Research skipped: a dependency bump with no source code; the installer output and the diff are the
  whole investigation and are recorded in plan.md.
- Frame skipped: the owner named the outcome directly.
