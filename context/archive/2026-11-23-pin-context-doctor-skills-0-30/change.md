---
change_id: pin-context-doctor-skills-0-30
title: "The context-doctor check in CI runs the @softure-ai/skills version the lockfile resolves"
status: archived
roadmap_item: null
branch: claude/project-thread-bo4m2v
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The `context-doctor` check run on the main branch's head runs `@softure-ai/skills` 0.30.0, the version the
lockfile resolves, and a test keeps the two together on every future bump.

## Context
Post-merge verification of `bump-softure-packages-2026-11-23` (PR #29) on `origin/master` 681eb30: the
package, the lockfile and `context/state.json` are on 0.30.0 and `npx softure-skills doctor` exits 0 locally,
but `.github/workflows/ci.yml` still pins `npx --package @softure-ai/skills@0.24.0 softure-skills doctor`, so the
green `context-doctor` check ran the old doctor. That pin moves with the package (routine step 2) and was missed.

## Constraints
- Only the CI pin and a guard test. No release, tag, publish or deploy.

## Notes
- Research skipped: one pin, found by grep over the repository (the only `@softure-ai/skills@` pin outside the archive).
- Frame skipped: the outcome follows from the owner's verification request.
