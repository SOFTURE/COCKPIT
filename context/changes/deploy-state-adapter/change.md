---
change_id: deploy-state-adapter
title: "Projects show what version runs in production and whether the last deploy passed"
status: new
roadmap_item: CMP-22
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
An optional adapter shows which version runs in production and whether the last deploy and its verification passed.

## Context
Roadmap item CMP-22 of `context/foundation/roadmap.md` (cockpit-v1, v1), quoted:

> ### CMP-22: Deploy state adapter
> - **Change ID:** `deploy-state-adapter`
> - **Status:** blocked (funding: slice not funded yet)
> - **Outcome:** an optional adapter shows which version runs in production and whether the last deploy and its verification passed.
> - **Prerequisites:** CMP-21; the owner funds the adapters slice.
> - **Touches (estimate):** `src/adapters/deploy/**`.
> - **Size (owner-requested):** M
> - **Slice:** Adapters
> - **Unknowns:**
>   - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
> - **Risk:** reads the deploy workflow runs and release reports; no access to servers.
> - **Baseline:** no deploy state; after: a fixture deploy run shows its version and result.
> - **PRD refs:** FR-17, G-3
> - **Input:** context/changes/deploy-state-adapter/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice: research gathers its findings when the slice is funded. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/adapters/deploy/**`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
