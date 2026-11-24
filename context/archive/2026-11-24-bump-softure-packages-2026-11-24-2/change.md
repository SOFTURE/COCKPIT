---
change_id: bump-softure-packages-2026-11-24-2
title: "The repository runs on the newest @softure-ai/* packages (2026-11-24, second run)"
status: archived
roadmap_item: null
branch: claude/project-thread-cesgei
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
Every `@softure-ai/*` package and SOFTURE pin is on its newest published version, as the package-update routine
(`routines/package-updates.md` in `@softure-ai/skills`) requires, run once on demand, and the repository declares how
an owner-word issue wakes it (`autonomy.ownerWordWake`).

## Context
Comparison against npm on 2026-11-24 (lockfile → newest): jobs 0.1.14 → 0.1.15, skills 0.35.0 → 0.36.0. Current:
auth 0.2.23, core 0.2.11, db 0.1.17, mailing 0.3.0, mcp-access 0.7.8, observability 0.8.8, ops 0.2.6, security
0.2.12, theme-kit 0.1.10, theme-notion 0.31.0, ui 0.3.11, config 0.1.7, deploy 0.7.9, testing 0.5.2. No held
packages, no owner steps (`routines.packageUpdates` absent). No open package-update pull request. The label
`owner-word` already exists on the repository.

What the release notes ask of this app:
- jobs 0.1.15: "run now" while a run is running queues one follow-up run instead of joining the running one
  (SOFTURE/AI#1454). Migrate: nothing; code that looks runs up by `SCHEDULE_DEDUP_KEY` alone should use
  `SCHEDULE_DEDUP_KEYS` (this app does not).
- skills 0.36.0: installer refresh (managed block: owner-word answers for `routines.packageUpdates` entries; doctor
  skill text), state and doctor; CI's `context-doctor` pin follows the locked version.

## Constraints
- No release, tag, publish or deploy: the bump rides the next release the owner orders.
- No change to SOFTURE code; no loosened test, guard or hook.
- `autonomy.ownerWordWake` is `"routine"`: the owner confirmed on 2026-11-24 (main chat, 10:12 UTC) that the
  owner-word wake scheduled task `trig_01HtirNAsPEeaSkfB8Pos9vp` has its GitHub trigger on this repository (issue
  opened, label `owner-word`). COCKPIT's part of the CV-2 owner step is ticked done in the archived roadmap; the other
  watched repositories stay open there.

## Notes
- Research skipped: the release notes (module CHANGELOG in the installed package, the installer diff) and the gates
  after the install are the whole investigation; both are recorded in plan.md.
- Frame skipped: the outcome is fixed by the routine.
- Change id carries `-2`: an earlier run on the same day already archived `bump-softure-packages-2026-11-24`.
- Branch: the session may push only to `claude/project-thread-cesgei`, so the routine's `claude/bump-softure-<date>`
  name is not used.
