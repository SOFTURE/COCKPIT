---
change_id: mcp-read-roadmaps
title: "MCP tools `list_roadmaps` and `get_roadmap`"
status: new
roadmap_item: CT-44
branch: null
created: 2026-11-27
updated: 2026-11-27
---

## Intent
The owner asks the assistant which roadmaps wait across the projects and gets a short card per roadmap (goal, open items, status, size) in one call answered from the stored scan, then reads the chosen roadmap in full through the roadmap page's own loader. Read access.

## Context
The roadmap item (cockpit-mcp-broadcast), verbatim:

### CT-44: MCP tools `list_roadmaps` and `get_roadmap`
- **Change ID:** `mcp-read-roadmaps`
- **Status:** ready
- **Outcome:** the owner asks the assistant which roadmaps wait across the projects and gets, in one call, a short
  card per roadmap that is enough to choose where to spend tokens; for the chosen one, a second call gives the whole
  roadmap. Read access (every token).
  - `list_roadmaps` (input: `project` optional, `owner/name` any letter case; `includeDone` optional, default false):
    answered from the stored scan only, **no forge call**, so it stays fast over every watched project. Answer:
    `{ readAt, projects: [{ project, readStatus, roadmaps: [card] }] }`, projects in the overview's order, a project
    with no roadmap listed with `roadmaps: []`, a project whose state cannot be read with its `readStatus` and
    `roadmaps: []`. Card: `{ slug, kind: "active" | "queued", title, status, startCondition, done, total,
    openItems, inProgress, blocked, waitingForOwner, nextItems: [{ id, outcome, status, stage }] (at most 5 open
    items, in file order), pageUrl }` where `pageUrl` is the roadmap page in COCKPIT. Fully done queued roadmaps
    are left out unless `includeDone`.
  - `get_roadmap` (input: `project`, `slug`): one roadmap through the roadmap page's own loader (`loadRoadmapView`, one
    forge read of the file, as the page does), answered as `{ project, slug, kind, title, goal, orders, status,
    version, updated, startCondition, done, total, sizeTally, items: [{ id, title, outcome, status, stage, size,
    prerequisites, changeId, ownerStep }], ownerChecks, openPromotions: [{ item, issueNumber, issueUrl }],
    promotable, fallback, pageUrl, fileUrl }`. `goal` is the roadmap's `Goal` paragraph (or the heading's subtitle
    when the file has none), `sizeTally` counts open items per size (`{ "S": 2, "M": 1, "unsized": 0 }`),
    `promotable` is true for a queued roadmap with at least one open item (`isPromotableItem`), `fallback` is the
    view's own reason when the file could not be read (then items come from the state and sizes are `null`).
  - The card's numbers are built by one pure function (`summarizeRoadmap`) from the stored state, so the overview
    row's `slug done/total` and the card never disagree.
- **Unlocks:** CT-45 (answers with `get_roadmap`'s shape after a promotion).
- **Prerequisites:** —
- **Touches (estimate):** `src/mcp/roadmap-reads.ts` (new), `src/roadmap/summarize-roadmap.ts` (new),
  `src/mcp/cockpit-reader.ts` (a `readRoadmap` entry), `src/mcp/cockpit-server.ts` (its registration block),
  `src/mcp/tool-catalog.ts`, `messages/en.ts`, `messages/pl.ts` (`mcp.tools.listRoadmaps`, `mcp.tools.getRoadmap`),
  `tests/mcp/**`, `tests/roadmap/**`, `e2e/mcp.spec.ts`.
- **Size:** M
- **Tests (required, each named for its behaviour):**
  - Unit (`summarizeRoadmap`): an active roadmap with items in every status group gives the exact counts; a queued
    roadmap with `start_condition`; `nextItems` capped at 5 and in file order; a fully done queued roadmap left out,
    and kept with `includeDone`; a state with `active_roadmap: null` and `queued: []` gives `roadmaps: []`.
  - Unit (`get_roadmap` answer): sizes tallied from the parsed file; the `Goal` paragraph found, and the subtitle used
    when there is none; `promotable` false for the active roadmap and for a queued roadmap with no open item;
    `fallback` set and sizes `null` when the file read fails.
  - Server (`tests/mcp/server.test.ts`): both tools listed for a read token; `list_roadmaps` makes no forge call (the
    fake forge records zero requests); an unknown project and an unknown slug are refused with
    `mcp.project_unknown` / `mcp.roadmap_unknown` and their message from `messages/`; a roadmap title and an item
    outcome carrying an injected instruction come back inside the untrusted-data markers.
  - Catalog parity: the token page's list and the server's registered tools stay equal (existing test extended).
  - e2e (`e2e/mcp.spec.ts`): with a read token, `list_roadmaps` returns the fixture project's active and queued
    roadmaps with the same `done/total` the project page shows, and `get_roadmap` returns the same items the roadmap
    page lists; the token page lists both tools at 1280 and 390 px, light and dark, in the existing tool-list layout.
- **Unknowns:**
  - Whether `loadRoadmapView` (it calls `connection()` and imports `server-only`) runs inside the MCP route handler
    as is, or needs its scan read split from the request-time guard. Recommended: split a pure
    `loadRoadmapViewFor(repository, slug, deps)` that both the page and the tool call; never a second loader.
    (owner: research; blocks: no)
- **Risk:** reading every roadmap file for the list would cost one forge call per roadmap per question; the list stays
  on the stored scan by rule and a test pins it.
- **Baseline:** the MCP answers show only `activeRoadmap` `slug done/total` per project; queued roadmaps, goals and
  sizes are not readable over MCP.
- **PRD refs:** FR-10, FR-13 (owner's request 2026-11-27)
- **Input:** context/changes/mcp-read-roadmaps/change.md

Findings gathered while recording it (2026-11-27):
- Owner, 2026-11-27: "add to the roadmap that the cockpit MCP returns the active roadmaps in each project with a short context, so we can quickly decide where to spend tokens; plus order a roadmap's realisation through MCP right away, the promote we have in the UI."
- The scan stores each project's `context/state.json` (`active_roadmap`, `queued[]`, `src/state/state-schema.ts`); sizes, orders and the `Goal` paragraph exist only in the roadmap file (`buildRoadmapView`).
- The current MCP answers carry only `numbers.activeRoadmap` (`slug done/total`, `src/overview/build-overview.ts`).
- `loadRoadmapView` calls `connection()` and imports `server-only`; whether it runs in the MCP route handler is the open unknown.

## Constraints
- Owns exclusively (lane D): `src/mcp/roadmap-reads.ts` (new), `src/roadmap/summarize-roadmap.ts` (new); its own registration block in `src/mcp/cockpit-server.ts` and `src/mcp/tool-catalog.ts`, its own block in `messages/en.ts` and `messages/pl.ts` (never edit CT-41's, CT-42's or CT-43's blocks).
- One rule: the roadmap page's loader and promote rule (`loadRoadmapView`, `promoteRoadmap`, `wakeAfterIssue`) are called, never copied.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- Every answer goes through `wrapAnswer` (untrusted-data markers); a test pins it.
- User-visible text through `messages/en.ts` and `messages/pl.ts`; design tokens and theme components only.
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it.
- A problem found in a SOFTURE package goes to SOFTURE/AI as an issue, never a local workaround.

## Notes
