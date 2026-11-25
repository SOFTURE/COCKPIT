---
change_id: bump-softure-skills-0-41
title: "The repository runs on @softure-ai/skills 0.41.1"
status: archived
roadmap_item: null
branch: claude/project-thread-3fku21
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
`@softure-ai/skills` is on its newest published version (0.41.1), as the package-update routine
(`routines/package-updates.md`) describes, on the owner's word in the project chat: the managed block, the installed
skills and `context/state.json` follow it, and the COCKPIT command routine (`routines/cockpit-command.md`) is the way
a cockpit issue reaches this project.

## Context
Lockfile 0.37.0 → npm 0.41.1. The owner asked for the skills package only, so the other `@softure-ai/*` packages are
out of scope for this change. No held packages, no owner steps (`routines.packageUpdates` absent), no open
package-update pull request.

What 0.41.1 asks of this app: the managed block renames owner-word issues to cockpit issues and drops the owner-word
wake routine (the `autonomy.ownerWordWake` key is no longer in WORKFLOW §2, so it leaves `workflow.json`); threads
read the main branch's CI on their merge commit (`wt-main-ci.py`); the doctor gains `--protection`. CI's
`context-doctor` pin follows the locked version.

## Constraints
- No release, tag, publish or deploy: the bump rides the next release the owner orders.
- No change to SOFTURE code; no loosened test, guard or hook.

## Notes
- Research skipped: the installer diff of the managed block, WORKFLOW §2 of the installed package and the gates after
  the install are the whole investigation; recorded in plan.md.
- Frame skipped: the outcome is fixed by the owner's word and the routine.
- `doctor --protection` reports `main-checks-not-required` on master: branch protection is the owner's step (agents
  get HTTP 403 on the protection API); it is reported to the owner, not fixed here.
- Branch: the session may push only to `claude/project-thread-3fku21`, so the routine's `claude/bump-softure-<date>`
  name is not used.
