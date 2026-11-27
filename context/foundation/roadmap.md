---
project: "COCKPIT"
roadmap: cockpit-mcp-broadcast
version: 1
status: ready
prd_version: 3
updated: 2026-11-27
---

# Roadmap cockpit-mcp-broadcast: the owner orders a broadcast through an assistant, and the broadcast list shows it

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: not ordered (no release, tag, publish or deploy without the owner's word)
> - Parallelism: up to 2 at once
> - Owner at the keyboard: none
> - Source: the owner's request of 2026-11-27: "order a broadcast through MCP, and still see on the broadcast list
>   that it was ordered that way"
> - No backward compatibility: one shape of the broadcast record, existing rows migrated once

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CT-40** | `broadcast-origin-shown` | every stored broadcast records how it was ordered (panel or MCP and its client), and the broadcast list and detail page show it next to the sender | — | autonomous | ready |
| **CT-41** | `mcp-send-broadcast` | an assistant with write access sends a broadcast over MCP through `sendBroadcast`, marked `mcp` on the list | CT-40 | autonomous | ready |
| **CT-42** | `mcp-read-broadcasts` | an assistant reads the broadcasts (`list_broadcasts`) and one broadcast's per-project state (`get_broadcast`) over MCP | CT-40 | autonomous | ready |
| **CT-43** | `mcp-retry-broadcast-send` | an assistant retries a failed project's send over MCP, as the panel's Retry does | CT-41, CT-42 | autonomous | ready |

## Order

**Goal (owner, 2026-11-27).** An assistant connected to COCKPIT over MCP with write access sends a broadcast exactly
as the panel does: the same rule (`sendBroadcast`, never a copy), the same marker and idempotency, the same routine
fires (CT-10). Every broadcast records where it came from, and the broadcast list and detail page show "panel" or
"MCP (<client>)" next to the sender. The assistant can then read the broadcast's per-project state (sending, sent,
done, failed, routine fires) without the panel.

**Framing.** Optimising for: one rule for every way a broadcast is ordered. First proof: CT-40, the origin on the
record and on the list, because every later item writes or reads it. Main risk: the MCP caller's client name is not
handed to the server today (SOFTURE/AI#1524, filed while recording this roadmap). Depth: the record and its view in
CT-40; the tools are thin wrappers over the panel's existing rules.

**Why this order.** CT-40 lands the migration and the `origin` input of `sendBroadcast`, so CT-41 only passes
`mcp`. CT-41 and CT-42 touch disjoint files and run in parallel after CT-40. CT-43 extends CT-41's tool file and
answers in CT-42's shape, so it goes last.

**Sizes:** S is a thin tool over an existing rule with its tests; M adds a migration or a new tool with its access
rule, answer shape and tests.

### Starting point
- 2026-11-27 (master 0501dcc): `sendBroadcast` (`src/broadcast/send-broadcast.ts:252`) takes `id`, `title`, `body`,
  `repositoryKeys`, `sentBy`, `sentByName`, `wake`; it has **two** callers today: the panel
  (`app/(app)/broadcast/actions.ts`) and scheduled tasks (`src/scheduled/run-scheduled-task.ts:88`, CT-36). The
  panel's Retry is `retryBroadcastSend` (`src/broadcast/send-broadcast.ts:306`, `RetrySendInput`), not `retrySend`
  (that is the row menu's handler name in `src/broadcast/send-row-menu.tsx`).
- Storage: `modules/projects/broadcasts.ts` (`saveBroadcast`, `StoredBroadcast`); the last migration is
  `0011_add_scheduled_task_repeat.sql`, so the next is `0012`.
- MCP: `src/mcp/cockpit-server.ts` registers the read tools and `answer_entry` (`registerAnswerTool`, only when
  `canWrite`); `src/mcp/tool-catalog.ts` names the tools; `src/mcp/mcp-writes.ts` reads `MCP_ALLOW_WRITES`;
  `src/mcp/answer-as-account.ts` names the account behind the token (`findAnswererName`).
- `@softure-ai/mcp-access` 0.7.9: the server factory gets `McpServerIdentity` = `userId`, `canWrite`, `tokenId`;
  **no client name**. `OAuthGrantView.clientName` and `AccessTokenView.name` exist only on the account page's lists.
  Gap filed as SOFTURE/AI#1524 (identity names the calling client).
- Tests: Vitest (`tests/**`), Playwright e2e (`e2e/**`); CI jobs `gates`, `e2e`, `deploy-dry-run`, `cli-package`,
  `context-doctor`.

### Lanes
| Lane | Chain | Owns | Note |
| --- | --- | --- | --- |
| A | CT-40 | `modules/projects/migrations/0012_*`, `modules/projects/broadcasts.ts`, the broadcasts part of `modules/projects/schema.ts`, `src/broadcast/send-broadcast.ts`, `src/broadcast/build-broadcast-view.ts`, `src/broadcast/load-broadcasts.ts`, `src/scheduled/run-scheduled-task.ts` (origin argument only), `app/(app)/broadcast/**`, `messages/en.ts` and `messages/pl.ts` (own block) | starts now |
| B | CT-41 → CT-43 | `src/mcp/broadcast-tool.ts` (new), `src/mcp/cockpit-server.ts` (registration), `src/mcp/tool-catalog.ts`, `src/broadcast/send-broadcast.ts` (input only) | after CT-40; CT-43 after CT-41 and CT-42 |
| C | CT-42 | `src/mcp/broadcast-reads.ts` (new), `src/mcp/cockpit-reader.ts` | after CT-40, parallel with CT-41 |

**Shared files.** `src/mcp/cockpit-server.ts` and `src/mcp/tool-catalog.ts` take one registration block per item
(CT-41 and CT-42 each add their own, never edit the other's); `messages/en.ts` and `messages/pl.ts` take a block per
item. The second of two parallel items to merge re-merges master.

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. The broadcast says how it was ordered** | CT-40 | 1 M |
| 2. The assistant sends and reads | CT-41, CT-42 | 1 M, 1 S |
| 3. The assistant retries | CT-43 | 1 S |

**Layout rule for CT-40 (binding).** The origin is one quiet badge in the row's identity, next to the sender, from the
shared theme row components (`ListEntry`, the theme `Badge`), the same on the list and on the detail page; the CT-25..CT-35
rule holds: one component, applied app-wide, no row changes its other content, no screen less tidy than today's.

**Test rule (every item).** Each item names its tests below; every CI job green before its merge; master CI green
after it.

## Items

### CT-40: Broadcast origin recorded and shown
- **Change ID:** `broadcast-origin-shown`
- **Status:** ready
- **Outcome:** every stored broadcast says how it was ordered, and the owner sees it on the broadcast list and the
  broadcast page. Migration `0012`: `broadcasts.origin text NOT NULL CHECK (origin IN ('panel', 'mcp'))` and
  `broadcasts.origin_client text NULL` (the MCP client's name from its OAuth registration, or the label of a
  hand-issued token). Existing rows are set to `'panel'` in the same migration; then the default is dropped, so every
  writer names its origin. Rollback: drop both columns. `saveBroadcast` and `StoredBroadcast` carry `origin` and
  `originClient`; `sendBroadcast` takes them as required input (the panel passes `panel`). The list row and the
  detail page show the origin as a badge next to the sender (`panel`: no badge, or a quiet "Panel"; `mcp`:
  "MCP · <client>"), from the shared list-row components. Copy in `messages/`.
- **Unlocks:** CT-41 (passes `mcp`), CT-42 (reads the origin).
- **Prerequisites:** —
- **Touches (estimate):** `modules/projects/migrations/0012_*`, `modules/projects/broadcasts.ts`,
  `modules/projects/schema.ts`, `src/broadcast/send-broadcast.ts`, `src/broadcast/build-broadcast-view.ts`,
  `src/broadcast/load-broadcasts.ts`, `src/scheduled/run-scheduled-task.ts`, `app/(app)/broadcast/**`,
  `messages/en.ts`, `messages/pl.ts`, `tests/**`, the broadcast e2e spec.
- **Size:** M
- **Unknowns:**
  - Scheduled tasks (CT-36) are a third caller of `sendBroadcast`; the owner's CHECK names only `panel` and `mcp`.
    Recommended: a scheduled task's broadcast records `panel` (it was set up in the panel), unless research finds the
    list should tell them apart, in which case add `'scheduled'` to the CHECK and record the decision.
    (owner: research; blocks: no)
  - Where `origin_client` comes from before SOFTURE/AI#1524 ships: CT-40 only stores and shows it; CT-41 fills it.
    (owner: research; blocks: no)
- **Risk:** the migration rewrites every existing row; a NOT NULL without the backfill fails on production data.
- **Baseline:** no origin stored; after: a migration test on a database with old rows (all become `panel`), view
  tests for both origins and for the empty client name ("MCP" alone), the e2e list at 1280 and 390 px.
- **PRD refs:** FR-13, FR-14 (owner's request 2026-11-27)
- **Input:** context/changes/broadcast-origin-shown/change.md

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

## Owner decisions and checks

## Done
