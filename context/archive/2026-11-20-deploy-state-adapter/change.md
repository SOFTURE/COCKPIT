---
change_id: deploy-state-adapter
title: "Projects show what version runs in production and whether the last deploy passed"
status: archived
roadmap_item: CMP-22
branch: claude/project-thread-elqmol
created: 2026-11-20
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
An optional adapter shows which version runs in production and whether the last deploy and its verification passed.

## Context
Roadmap item CMP-22 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-22: Deploy state adapter
> - **Change ID:** `deploy-state-adapter`
> - **Status:** ready
> - **Outcome:** an optional adapter shows which version runs in production and whether the last deploy and its verification passed.
> - **Prerequisites:** CMP-21.
> - **Touches (estimate):** `src/adapters/deploy/**`.
> - **Size:** M
> - **Unknowns:** none
> - **Risk:** reads the deploy workflow runs and release reports; no access to servers.
> - **Baseline:** no deploy state; after: a fixture deploy run shows its version and result.
> - **PRD refs:** FR-17, G-3
> - **Input:** context/changes/deploy-state-adapter/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/adapters/deploy/**`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- `frame` skipped: the outcome and the PRD acceptance (FR-17) are clear; research settled where the facts come from.
- Archived 2026-11-23: a project with a deploy workflow shows on its page the version in production and its last deploy (passed, failed at a step, cancelled, running) with its verification and run; one without the workflow shows nothing extra.
