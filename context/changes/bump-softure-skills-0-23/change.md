---
change_id: bump-softure-skills-0-23
title: "The repository runs on @softure-ai/skills 0.23.0 with its refreshed skills, AGENTS.md block and a named project"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-5tlf70
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The project uses the latest published `@softure-ai/skills` (0.23.0), so the roadmap revision that
follows (the owner funds every slice, gap issues re-checked) is written with the current skills, and
`context/state.json` names the project instead of falling back to the repository name.

## Context
Owner request in the project chat (2026-11-20): record the "all in" decision in the roadmap and check
the gap issues filed during planning, which the owner reports as done. The repository runs on 0.21.0
(PR #2). npm lists 0.23.0 as the newest version. 0.23.0 closes part of SOFTURE/SKILLS#48: the doctor
result is readable without a checkout, from the check run `context-doctor` on the main branch's head.

## Constraints
- Only the package bump, what its installer writes (`package.json`, `package-lock.json`,
  `.claude/skills/**`, `.claude/softure-skills.json`, the managed block of `AGENTS.md`) and the
  `project` key the installer asks for in `context/workflow.json`.
- Project rules above the managed block stay untouched.
- No release, tag, publish or deploy. No CI yet (AGENTS.md: CI comes with the stack in CMP-1).

## Notes
- Research skipped: a dependency bump with no source code; the installer output and the diff are the
  whole investigation and are recorded in plan.md.
- Frame skipped: the outcome follows directly from the owner's request.
