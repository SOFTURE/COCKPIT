---
change_id: terminal-prints-cockpit-views
title: "A CLI prints the overview, the inbox and a project's detail"
status: new
roadmap_item: CMP-17
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner runs the CLI with a read token and prints the overview, the inbox and a project's detail as tables (and JSON).

## Context
Roadmap item CMP-17 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-17: Terminal prints COCKPIT views
> - **Change ID:** `terminal-prints-cockpit-views`
> - **Status:** ready
> - **Outcome:** the owner runs the CLI with a read token and prints the overview, the inbox and a project's detail as tables (and JSON).
> - **Prerequisites:** CMP-14.
> - **Touches (estimate):** `cli/**`, `package.json` (bin).
> - **Size:** M
> - **Unknowns:** none
> - **Risk:** reuses the MCP read tools as its API, so it adds no endpoint of its own.
> - **Baseline:** no CLI; after: the CLI prints the fixture overview equal to the screen.
> - **PRD refs:** FR-15, G-5
> - **Input:** context/changes/terminal-prints-cockpit-views/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `cli/**`, `package.json` (bin).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
