---
change_id: bump-softure-packages-2026-11-24-3
title: "The repository runs on @softure-ai/skills 0.37.0 (2026-11-24, third run)"
status: archived
roadmap_item: null
branch: claude/project-thread-8iva06
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
Every `@softure-ai/*` package and SOFTURE pin is on its newest published version, as the package-update routine
(`routines/package-updates.md` in `@softure-ai/skills`) requires, run once on the owner's word (cockpit issue #79):
`@softure-ai/skills` 0.37.0 or newer, with any owner entries answered "later" settled the 0.37.0 way.

## Context
Comparison against npm on 2026-11-24 (lockfile → newest): skills 0.36.0 → 0.37.0. Current: auth 0.2.23, core 0.2.11,
db 0.1.17, jobs 0.1.15, mailing 0.3.0, mcp-access 0.7.8, observability 0.8.8, ops 0.2.6, security 0.2.12, theme-kit
0.1.10, theme-notion 0.31.0, ui 0.3.11, config 0.1.7, deploy 0.7.9, testing 0.5.2. No held packages, no owner steps
(`routines.packageUpdates` absent). No open package-update pull request.

What 0.37.0 asks of this app (managed block and WORKFLOW §8.6): every owner answer removes the entry from the owner
queue; `later` moves the item to `context/foundation/roadmaps/roadmap-later.md` as a new item with that roadmap's own
numbering, the old row marked `carried`; an entry left open with `(later: #N)` is noted by the doctor
(`owner-entry-put-off`). CI's `context-doctor` pin follows the locked version.

## Constraints
- No release, tag, publish or deploy: the bump rides the next release the owner orders.
- No change to SOFTURE code; no loosened test, guard or hook.

## Notes
- Research skipped: the installer diff, WORKFLOW §8.6 of the installed package and the gates after the install are the
  whole investigation; recorded in plan.md.
- Frame skipped: the outcome is fixed by the owner's word and the routine.
- No entry answered "later" exists: the live roadmap and its archived predecessors carry no `(later: #N)` entry, no
  cockpit issue of this repository carries a `later` answer, and the doctor reports no `owner-entry-put-off`. So no
  `roadmaps/roadmap-later.md` is created.
- Branch: the session may push only to `claude/project-thread-8iva06`, so the routine's `claude/bump-softure-<date>`
  name is not used.
