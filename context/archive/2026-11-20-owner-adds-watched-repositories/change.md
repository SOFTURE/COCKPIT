---
change_id: owner-adds-watched-repositories
title: "The owner adds and removes watched repositories; missing permissions are named"
status: archived
roadmap_item: CMP-2
branch: claude/project-thread-f5a9he
created: 2026-11-20
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The owner adds `owner/name` repositories on the Settings screen and removes them; COCKPIT checks it can read each one's `context/state.json`, marks "no state yet" where it is missing and names any missing permission; the projects appear in the sidebar.

## Context
Roadmap item CMP-2 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-2: Owner adds watched repositories
> - **Change ID:** `owner-adds-watched-repositories`
> - **Status:** ready
> - **Outcome:** the owner adds `owner/name` repositories on the Settings screen and removes them; COCKPIT checks it can read each one's `context/state.json`, marks "no state yet" where it is missing and names any missing permission; the projects appear in the sidebar.
> - **Prerequisites:** CMP-1; a forge token for tests is fictional (fake forge).
> - **Touches (estimate):** `src/forge/client.ts`, `src/forge/permissions.ts`, `src/projects/**`, `app/(app)/settings/**`, `src/shell/sidebar-projects.tsx`, `db/migrations/` (one: watched projects), `messages/en.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - How does the forge report missing fine-grained permissions on a read (403 body, headers)? (owner: research; blocks: no)
> - **Risk:** early because every scan and screen reads this list; it also proves the least-privilege access before anything writes.
> - **Baseline:** no projects; after: a test adds a fictional repository through a fake forge, sees it in the sidebar, and sees a named missing permission for a second one.
> - **PRD refs:** FR-2, NFR-5, NFR-6
> - **Input:** context/changes/owner-adds-watched-repositories/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/core` `requestJson` handles timeouts, no redirects, `Retry-After`, `readHeaders` and `parseLinkHeader` for paging; provider-specific clients are out of scope of `@softure-ai/connections` (its README: "the app calls the API with the token and `requestJson` of `@softure-ai/core`").
- The state schema ships in `@softure-ai/skills`: `skills/softure-doctor/references/state.schema.json` (schema_version 1).
- Decision (shape notes): watched repositories live in COCKPIT's database, edited on a settings screen; the token stays in the environment. Fine-grained token permissions: Metadata read, Contents read, Issues read and write, Pull requests read, Actions read.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/forge/client.ts`, `src/forge/permissions.ts`, `src/projects/**`, `app/(app)/settings/**`, `src/shell/sidebar-projects.tsx`, `db/migrations/` (one: watched projects), `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
- Frame skipped: the outcome is a direct PRD requirement (FR-2) with no competing framing.
- Archived 2026-11-23: the owner adds and removes watched repositories on Settings; unreadable ones are refused with the missing permission named, readable ones show their state and missing reads, and the sidebar lists them.
