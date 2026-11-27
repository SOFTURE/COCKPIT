---
change_id: mcp-retry-broadcast-send
title: "MCP tool `retry_broadcast_send`"
status: new
roadmap_item: CT-43
branch: null
created: 2026-11-27
updated: 2026-11-27
---

## Intent
A failed project's send is retried from the assistant, as the panel's Retry does (`retryBroadcastSend`), with the same write access as CT-41; the answer is that project's state in CT-42's shape.

## Context
The roadmap item (cockpit-mcp-broadcast), verbatim:

### CT-43: MCP tool `retry_broadcast_send`
- **Change ID:** `mcp-retry-broadcast-send`
- **Status:** ready
- **Outcome:** a failed project's send is retried from the assistant, as the panel's Retry does
  (`retryBroadcastSend`), with the same write access as CT-41; the answer is that project's state in CT-42's shape.
- **Prerequisites:** CT-41, CT-42
- **Touches (estimate):** `src/mcp/broadcast-tool.ts`, `src/mcp/tool-catalog.ts`, `tests/mcp/**`.
- **Size:** S
- **Unknowns:** none
- **Risk:** a retry of a project that is not failed; refused with the panel's own code.
- **Baseline:** retry only from the panel; after: tests that a failed send is retried once, a sent or unknown project
  is refused, and a read-only grant is refused.
- **PRD refs:** FR-14
- **Input:** context/changes/mcp-retry-broadcast-send/change.md

Findings gathered while recording it (2026-11-27):
- Owner, 2026-11-27 (the roadmap pasted in the project chat): "order a broadcast through MCP, and still see on the broadcast list that it was ordered that way"; no backward compatibility, one shape of the broadcast record.
- The panel's Retry calls `retryBroadcastSend` (`src/broadcast/send-broadcast.ts:306`, `RetrySendInput`: `broadcastId`, `repositoryKey`); `retrySend` is only the row menu's handler name.

## Constraints
- Owns exclusively (lane B): `src/mcp/broadcast-tool.ts`, its registration block in `src/mcp/cockpit-server.ts` and `src/mcp/tool-catalog.ts`.
- One rule: `sendBroadcast` and `retryBroadcastSend` are called, never copied.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- User-visible text through `messages/en.ts` and `messages/pl.ts`; design tokens and theme components only.
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it.
- A problem found in a SOFTURE package goes to SOFTURE/AI as an issue, never a local workaround.

## Notes
