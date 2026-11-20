---
change_id: assistant-answers-entries-over-mcp
title: "With write access, an assistant answers an entry exactly as the inbox does"
status: new
roadmap_item: CMP-15
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
With a write token, the owner answers an entry through an assistant; the same rule as the inbox applies (one issue, sent, done); a read token is refused.

## Context
Roadmap item CMP-15 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-15: Assistant answers entries over MCP
> - **Change ID:** `assistant-answers-entries-over-mcp`
> - **Status:** ready
> - **Outcome:** with a write token, the owner answers an entry through an assistant; the same rule as the inbox applies (one issue, sent, done); a read token is refused.
> - **Prerequisites:** CMP-14, CMP-5.
> - **Touches (estimate):** `src/mcp/tools/decide.ts`.
> - **Size:** S
> - **Unknowns:** none
> - **Risk:** a second path to the only write; it reuses CMP-5's rule, never a copy.
> - **Baseline:** answers only from the inbox; after: a test answers through the tool and finds one issue.
> - **PRD refs:** FR-14, G-2, G-5
> - **Input:** context/changes/assistant-answers-entries-over-mcp/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/mcp/tools/decide.ts`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
