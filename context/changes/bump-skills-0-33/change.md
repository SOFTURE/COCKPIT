---
change_id: bump-skills-0-33
title: "The repository runs @softure-ai/skills 0.33.0 and its doctor checks the roadmap item shape"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-stdmag
created: 2026-11-23
updated: 2026-11-23
---

## Intent
`@softure-ai/skills` is on 0.33.0 in the package, the lockfile, the installed skills, the managed block of
`AGENTS.md` and the `context-doctor` CI pin, and the 0.33.0 doctor (with its `roadmap-item-shape` check) is green
on this repository, so COCKPIT reads this project's own roadmap correctly.

## Context
Owner request in the project (2026-11-23): bump to 0.33.0, run the doctor, fix any `roadmap-item-shape` finding
(the at-a-glance row is the source of truth for every `### ID: Title` block), regenerate the state and keep the
doctor green. An earlier change already fixed the one known mismatch (CMP-21).

## Constraints
- Only the bump, what its installer writes, the CI pin and `context/` files the doctor names.
- Project rules above the managed block stay untouched.
- No release, tag, publish or deploy.

## Notes
- Research skipped: a dependency bump with no source code; the installer and doctor output are the whole
  investigation and are recorded in plan.md.
- Frame skipped: the outcome follows directly from the owner's request.
