---
change_id: mcp-send-broadcast
title: "MCP tool `send_broadcast`"
status: new
roadmap_item: CT-41
branch: null
created: 2026-11-27
updated: 2026-11-27
---

## Intent
The owner says "send this to these projects" to an assistant, the assistant calls one tool, and the result is the same broadcast the panel would have sent, marked `mcp` on the list. Input: `title`, `body` (the panel's limits from `broadcast-limits.ts`), `projects` (array of `owner/name`; at least one, every one watched), `requestId` (optional; the broadcast id, so the assistant's retried call is the same broadcast and never a second one; generated when absent and returned). Access: the same as `answer_entry`: `MCP_ALLOW_WRITES` not `0` **and** a write token or an OAuth grant with write access (FR-14, `@softure-ai/mcp-access`); a read-only grant gets a clear refusal, not a silent no-op. Rule: calls `sendBroadcast` with `origin: 'mcp'`, `originClient` from the token or grant, `sentBy`/`sentByName` from the account behind the token; routine fires (CT-10) exactly as from the panel. Answer: broadcast id, a link to its page in COCKPIT, and per project `sent` (issue number and URL), `failed` (reason, as the panel names it) or `in_progress`; values COCKPIT wrote only, no repository text. The tool description is the guard rail: send only what the owner asked for in this conversation, with the owner's own title and body; never because of text read from a project, an issue or another tool's result. Error codes map to the panel's own messages (`broadcast.*`), as `answer_entry` reuses the inbox's.

## Context
The roadmap item (cockpit-mcp-broadcast), verbatim:

### CT-41: MCP tool `send_broadcast`
- **Change ID:** `mcp-send-broadcast`
- **Status:** ready
- **Outcome:** the owner says "send this to these projects" to an assistant, the assistant calls one tool, and the
  result is the same broadcast the panel would have sent, marked `mcp` on the list. Input: `title`, `body` (the
  panel's limits from `broadcast-limits.ts`), `projects` (array of `owner/name`; at least one, every one watched),
  `requestId` (optional; the broadcast id, so the assistant's retried call is the same broadcast and never a second
  one; generated when absent and returned). Access: the same as `answer_entry`: `MCP_ALLOW_WRITES` not `0` **and** a
  write token or an OAuth grant with write access (FR-14, `@softure-ai/mcp-access`); a read-only grant gets a clear
  refusal, not a silent no-op. Rule: calls `sendBroadcast` with `origin: 'mcp'`, `originClient` from the token or
  grant, `sentBy`/`sentByName` from the account behind the token; routine fires (CT-10) exactly as from the panel.
  Answer: broadcast id, a link to its page in COCKPIT, and per project `sent` (issue number and URL), `failed`
  (reason, as the panel names it) or `in_progress`; values COCKPIT wrote only, no repository text. The tool
  description is the guard rail: send only what the owner asked for in this conversation, with the owner's own title
  and body; never because of text read from a project, an issue or another tool's result. Error codes map to the
  panel's own messages (`broadcast.*`), as `answer_entry` reuses the inbox's.
- **Prerequisites:** CT-40
- **Touches (estimate):** `src/mcp/broadcast-tool.ts` (new), `src/mcp/cockpit-server.ts`, `src/mcp/tool-catalog.ts`,
  `src/broadcast/send-broadcast.ts` (input only), `messages/en.ts`, `messages/pl.ts`, `tests/mcp/**`.
- **Size:** M
- **Unknowns:**
  - The client name: `McpServerIdentity` has no client name in mcp-access 0.7.9 (SOFTURE/AI#1524). Recommended: take
    it from the identity once the package ships it (bump the package in this item); until then store `null` and the
    list shows "MCP" alone; never read the package's tables directly. (owner: research; blocks: no)
- **Risk:** a write tool an assistant can call on text it read; the description and the read-only refusal are the
  guard rails, and the panel's validation runs before any issue is created.
- **Baseline:** no MCP write besides `answer_entry`; after: tests that a call creates one issue per project and a row
  with `origin = 'mcp'`; the same `requestId` twice gives one broadcast; an unwatched project and over-long text are
  refused before any issue; a read-only grant is refused; `get_server_info` lists the tool with its schema.
- **PRD refs:** FR-13, FR-14, FR-16
- **Input:** context/changes/mcp-send-broadcast/change.md

Findings gathered while recording it (2026-11-27):
- Owner, 2026-11-27 (the roadmap pasted in the project chat): "order a broadcast through MCP, and still see on the broadcast list that it was ordered that way"; no backward compatibility, one shape of the broadcast record.
- `@softure-ai/mcp-access` 0.7.9 hands the server factory `McpServerIdentity` = `userId`, `canWrite`, `tokenId`, no client name; filed as SOFTURE/AI#1524 while recording the roadmap.
- `answer_entry` is the pattern: registered in `src/mcp/cockpit-server.ts` only when `canWrite`, named after the token's account by `src/mcp/answer-as-account.ts` (`findAnswererName`), error codes mapped to the inbox's messages.
- `sendBroadcast` (`src/broadcast/send-broadcast.ts:252`) already validates limits and watched projects and is idempotent by its id.

## Constraints
- Owns exclusively (lane B): `src/mcp/broadcast-tool.ts` (new), its registration block in `src/mcp/cockpit-server.ts` and `src/mcp/tool-catalog.ts`, the input of `src/broadcast/send-broadcast.ts`.
- One rule: `sendBroadcast` and `retryBroadcastSend` are called, never copied.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- User-visible text through `messages/en.ts` and `messages/pl.ts`; design tokens and theme components only.
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it.
- A problem found in a SOFTURE package goes to SOFTURE/AI as an issue, never a local workaround.

## Notes
