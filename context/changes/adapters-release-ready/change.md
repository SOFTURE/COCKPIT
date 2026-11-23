---
change_id: adapters-release-ready
title: "(release) the adapters slice is ready to release; nothing released without the owner's word"
status: planned
roadmap_item: CMP-23
branch: claude/project-thread-vxwg0m
created: 2026-11-20
updated: 2026-11-23
archived_at: null
---

## Intent
The adapters slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.

## Context
Roadmap item CMP-23 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-23: Adapters release ready
> - **Change ID:** `adapters-release-ready`
> - **Status:** ready
> - **Outcome:** the adapters slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.
> - **Prerequisites:** CMP-22.
> - **Touches (estimate):** `package.json` (version), `CHANGELOG.md`.
> - **Size:** S
> - **Unknowns:** none
> - **Risk:** closes the slice.
> - **Baseline:** unreleased; after: dry run green, release notes list CMP-21 and CMP-22.
> - **PRD refs:** FR-9
> - **Input:** context/changes/adapters-release-ready/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json` (version), `CHANGELOG.md`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- CMP-21 (2026-11-23): the observability adapter reads `GRAFANA_URL` and `GRAFANA_TOKEN` (optional; unset = off);
  the production compose (app and worker), the deploy workflow's secret names and their test still need them.
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- `frame` skipped: a packaging step the roadmap fixes; no competing framing (research.md, Framing).
