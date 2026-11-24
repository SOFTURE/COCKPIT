---
change_id: entries-keyed-by-project-and-id
title: "Entries are told apart by project and id"
status: archived
roadmap_item: CT-8
branch: claude/project-thread-0gms1g
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
an owner-queue entry is identified by its project and its id everywhere: the stored answers (already `repository_key, entry_id`), the inbox rows and their history, the digest's new-entry comparison, the answer form and the MCP `answer_entry`; a test with two fictional projects whose queues carry the same id and text answers one and finds the other still open, with its own history and digest line.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-8: Entries are told apart by project and id
> - **Change ID:** `entries-keyed-by-project-and-id`
> - **Status:** ready
> - **Outcome:** an owner-queue entry is identified by its project and its id everywhere: the stored answers (already
>   `repository_key, entry_id`), the inbox rows and their history, the digest's new-entry comparison, the answer form
>   and the MCP `answer_entry`; a test with two fictional projects whose queues carry the same id and text answers one
>   and finds the other still open, with its own history and digest line.
> - **Prerequisites:** — (starts after the ad-hoc inbox project-tabs change merges: both edit `src/inbox/**`)
> - **Touches (estimate):** `src/inbox/build-inbox.ts`, `src/inbox/inbox-row.tsx` (`data-entry` names the project too),
>   `src/digest/compare-snapshots.ts`, `src/mcp/answer-tool.ts`, tests under `tests/inbox/**`, `tests/digest/**`,
>   `tests/mcp/**`.
> - **Size:** S
> - **Unknowns:**
>   - Is anything keyed by id alone today? A first read found the answers table, the MCP tool and the inbox page keyed by
>     project and id; `data-entry` on an inbox row and the digest comparison by id within a project. The change proves it
>     with the test and fixes what fails. (owner: research; blocks: no)
> - **Risk:** none beyond a test that finds a real mix-up.
> - **Baseline:** today no test covers two projects with the same entry id (the same "start queued roadmap later" entry
>   carries one id in two watched projects); after: that test passes.
> - **PRD refs:** F-8, FR-4, FR-5, FR-6
> - **Input:** context/changes/entries-keyed-by-project-and-id/change.md

Findings gathered while recording it (2026-11-24):
- Owner-queue entry ids are stable per text and source, so the same entry ("start queued roadmap … later") carries
  the same id in two watched projects (seen over MCP on 2026-11-24).
- A first read found: answers stored with `UNIQUE (repository_key, entry_id, md5(entry_text))`
  (`modules/projects/migrations/0003_create_answers.sql`); `buildInbox` matches answers and marker issues per source;
  the MCP `answer_entry` finds the row by `projectKey` and `entry.id` (`src/mcp/answer-tool.ts`); the inbox page keys
  rows by `projectKey:id`. Keyed by id alone: `data-entry` on an inbox row (`src/inbox/inbox-row.tsx`), the project
  page's React keys (one project only, harmless) and the digest's `openBefore` set (built per project in
  `src/digest/compare-snapshots.ts`).
- The ad-hoc inbox project-tabs change is editing `src/inbox/**`; this change starts after it merges.

## Constraints
- Owns exclusively (estimate): tests for the case under `tests/inbox/**`, `tests/digest/**`, `tests/mcp/**`; edits
  `src/inbox/build-inbox.ts`, `src/inbox/inbox-row.tsx`, `src/digest/compare-snapshots.ts`, `src/mcp/answer-tool.ts`
  only where a test fails.
- Read-only toward watched repositories (NFR-7).
- No release, tag, publish or deploy without the owner's word.

## Notes
- Research found every path already keyed by project and id except an inbox row's `data-entry`; the tests prove the
  rest and the row now names its project.

## Done
- Tests for two projects sharing one entry id on the answers rule, the inbox rows and history, the digest and the MCP
  answer request; an inbox row's `data-entry` names its project. Waiting: release.
