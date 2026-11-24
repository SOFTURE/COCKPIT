---
change_id: bump-softure-packages-2026-11-24
title: "The repository runs on the newest @softure-ai/* packages (2026-11-24)"
status: planned
roadmap_item: null
branch: claude/project-thread-cw9vnq
created: 2026-11-24
updated: 2026-11-24
---

## Intent
Every `@softure-ai/*` package and SOFTURE pin is on its newest published version, as the nightly package-update
routine (`routines/package-updates.md` in `@softure-ai/skills`) requires, with the project adapted to what the new
versions ask.

## Context
Comparison against npm on 2026-11-24 (lockfile → newest): auth 0.2.21 → 0.2.23, mailing 0.2.8 → 0.3.0,
theme-notion 0.30.0 → 0.31.0, deploy 0.7.8 → 0.7.9, skills 0.33.0 → 0.34.0. Current: core 0.2.11, db 0.1.17,
jobs 0.1.14, mcp-access 0.7.8, observability 0.8.8, ops 0.2.6, security 0.2.12, theme-kit 0.1.10, ui 0.3.11,
config 0.1.7, testing 0.5.2. No held packages (`routines.packageUpdates.hold` absent). No open package-update PR.

What the release notes ask of this app:
- mailing 0.3.0 (breaking): recipient keys need `SOFTURE_EMAIL_KEY_SECRET` (at least 32 characters); without it
  `deliverOnce` throws. Migration `0006` drops three SQL functions this app never calls. The digest is off in
  production (its secrets are empty), so no stored keys are lost.
- auth 0.2.22/0.2.23: works with mailing ^0.3.0; new `LogoutButton` styling props (nothing required).
- theme-notion 0.31.0: a `PageLayout` component; an app with its own page wrapper replaces it.
- deploy 0.7.9: `publicPaths` in `deploy.json`; SOFTURE/AI workflow pins move to the `deploy@0.7.9` commit.
- skills 0.34.0: installer refresh (managed block: `wt-roadmap.py released`), state and doctor.

## Constraints
- No release, tag, publish or deploy: the bump rides the next release the owner orders.
- No change to SOFTURE code; no loosened test, guard or hook.
- Project rules above the managed block of `AGENTS.md` stay untouched.

## Notes
- Research skipped: the release notes (SOFTURE/AI module CHANGELOGs at their tags, the installer diff) and the red
  gates after the install are the whole investigation; both are recorded in plan.md.
- Frame skipped: the outcome is fixed by the routine.
- Branch: the session may push only to `claude/project-thread-cw9vnq`, so the routine's `claude/bump-softure-<date>`
  name is not used.
