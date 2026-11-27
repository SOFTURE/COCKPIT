---
change_id: mcp-read-broadcasts
title: "MCP tools `list_broadcasts` and `get_broadcast`"
status: new
roadmap_item: CT-42
branch: null
created: 2026-11-27
updated: 2026-11-27
---

## Intent
The assistant checks a broadcast's result itself (sent, done once the project's thread closed the issue, failed with the reason, routine fires) instead of the owner reading the panel. `list_broadcasts`: newest first, with title, origin, sender, sent-at and counts per state; optional `limit`. `get_broadcast(id)`: the detail page's data from `build-broadcast-view.ts` (no forge call; "done" follows the scan). Read access only; titles and bodies are the owner's own text, issue titles from repositories go inside the untrusted-data markers like every other read tool.

## Context
The roadmap item (cockpit-mcp-broadcast), verbatim:

### CT-42: MCP tools `list_broadcasts` and `get_broadcast`
- **Change ID:** `mcp-read-broadcasts`
- **Status:** ready
- **Outcome:** the assistant checks a broadcast's result itself (sent, done once the project's thread closed the
  issue, failed with the reason, routine fires) instead of the owner reading the panel. `list_broadcasts`: newest
  first, with title, origin, sender, sent-at and counts per state; optional `limit`. `get_broadcast(id)`: the detail
  page's data from `build-broadcast-view.ts` (no forge call; "done" follows the scan). Read access only; titles and
  bodies are the owner's own text, issue titles from repositories go inside the untrusted-data markers like every
  other read tool.
- **Prerequisites:** CT-40
- **Touches (estimate):** `src/mcp/broadcast-reads.ts` (new), `src/mcp/cockpit-reader.ts`, `src/mcp/cockpit-server.ts`
  (registration block), `src/mcp/tool-catalog.ts`, `tests/mcp/**`.
- **Size:** S
- **Unknowns:** none
- **Risk:** repository text leaking out of the untrusted-data markers; pinned by a test.
- **Baseline:** no broadcast read over MCP; after: tests for the list order and counts, `get_broadcast` per state
  (sending, sent, done, failed, fires), an unknown id, and an issue title wrapped in the markers.
- **PRD refs:** FR-13
- **Input:** context/changes/mcp-read-broadcasts/change.md

Findings gathered while recording it (2026-11-27):
- Owner, 2026-11-27 (the roadmap pasted in the project chat): "order a broadcast through MCP, and still see on the broadcast list that it was ordered that way"; no backward compatibility, one shape of the broadcast record.
- `src/broadcast/build-broadcast-view.ts` builds the detail page's data; read tools wrap repository text with the untrusted-data markers (`src/mcp/cockpit-reader.ts`).

## Constraints
- Owns exclusively (lane C): `src/mcp/broadcast-reads.ts` (new), `src/mcp/cockpit-reader.ts`, its registration block in `src/mcp/cockpit-server.ts` and `src/mcp/tool-catalog.ts`.
- One rule: `sendBroadcast` and `retryBroadcastSend` are called, never copied.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- User-visible text through `messages/en.ts` and `messages/pl.ts`; design tokens and theme components only.
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it.
- A problem found in a SOFTURE package goes to SOFTURE/AI as an issue, never a local workaround.

## Notes
