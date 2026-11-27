---
change_id: broadcast-origin-shown
title: "Broadcast origin recorded and shown"
status: new
roadmap_item: CT-40
branch: null
created: 2026-11-27
updated: 2026-11-27
---

## Intent
Every stored broadcast says how it was ordered, and the owner sees it on the broadcast list and the broadcast page. Migration `0012`: `broadcasts.origin text NOT NULL CHECK (origin IN ('panel', 'mcp'))` and `broadcasts.origin_client text NULL` (the MCP client's name from its OAuth registration, or the label of a hand-issued token). Existing rows are set to `'panel'` in the same migration; then the default is dropped, so every writer names its origin. Rollback: drop both columns. `saveBroadcast` and `StoredBroadcast` carry `origin` and `originClient`; `sendBroadcast` takes them as required input (the panel passes `panel`). The list row and the detail page show the origin as a badge next to the sender (`panel`: no badge, or a quiet "Panel"; `mcp`: "MCP · <client>"), from the shared list-row components. Copy in `messages/`.

## Context
The roadmap item (cockpit-mcp-broadcast), verbatim:

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

Findings gathered while recording it (2026-11-27):
- Owner, 2026-11-27 (the roadmap pasted in the project chat): "order a broadcast through MCP, and still see on the broadcast list that it was ordered that way"; no backward compatibility, one shape of the broadcast record.
- `sendBroadcast` has two callers on master 0501dcc: the panel (`app/(app)/broadcast/actions.ts:52`) and scheduled tasks (`src/scheduled/run-scheduled-task.ts:88`); both must name an origin once the default is dropped.
- The last migration is `0011_add_scheduled_task_repeat.sql`; this item's is `0012`.
- The row and the detail page are built from `src/broadcast/build-broadcast-view.ts` and `src/broadcast/load-broadcasts.ts` on theme-notion's `ListEntry` (CT-26).

## Constraints
- Owns exclusively (lane A): `modules/projects/migrations/0012_*`, `modules/projects/broadcasts.ts`, the broadcasts part of `modules/projects/schema.ts`, `src/broadcast/send-broadcast.ts`, `src/broadcast/build-broadcast-view.ts`, `src/broadcast/load-broadcasts.ts`, `src/scheduled/run-scheduled-task.ts` (origin argument only), `app/(app)/broadcast/**`, its own block in `messages/en.ts` and `messages/pl.ts`.
- One rule: `sendBroadcast` and `retryBroadcastSend` are called, never copied.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- User-visible text through `messages/en.ts` and `messages/pl.ts`; design tokens and theme components only.
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it.
- A problem found in a SOFTURE package goes to SOFTURE/AI as an issue, never a local workaround.

## Notes
