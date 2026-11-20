---
change_id: assistant-reads-cockpit-over-mcp
title: "An assistant connected over MCP reads the overview, the inbox and a project's detail"
status: new
roadmap_item: CMP-14
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner connects an assistant with a read token or OAuth and asks for the overview, the inbox and a project's detail; the answers match the screens.

## Context
Roadmap item CMP-14 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-14: Assistant reads COCKPIT over MCP
> - **Change ID:** `assistant-reads-cockpit-over-mcp`
> - **Status:** ready
> - **Outcome:** the owner connects an assistant with a read token or OAuth and asks for the overview, the inbox and a project's detail; the answers match the screens.
> - **Prerequisites:** CMP-8.
> - **Touches (estimate):** `src/mcp/**`, `app/api/mcp/**`, `softure.config.ts` (mcp-access), `db/` (module migrations of mcp-access).
> - **Size (owner-requested):** M
> - **Slice:** MCP
> - **Unknowns:** none
> - **Risk:** the phone path through an assistant.
> - **Baseline:** no MCP; after: the catalog parity check passes and each read tool returns the fixture data.
> - **PRD refs:** FR-13, G-5
> - **Input:** context/changes/assistant-reads-cockpit-over-mcp/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/mcp-access` 0.7.8: hashed, scoped, expiring tokens, a rate-limited Bearer endpoint around the app's MCP server factory, OAuth 2.1 for assistants, a token page, a catalog parity check.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/mcp/**`, `app/api/mcp/**`, `softure.config.ts` (mcp-access), `db/` (module migrations of mcp-access).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
