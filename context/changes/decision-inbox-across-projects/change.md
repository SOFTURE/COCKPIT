---
change_id: decision-inbox-across-projects
title: "The owner sees every owner-queue entry of every project in one inbox, oldest first"
status: plan_reviewed
roadmap_item: CMP-4
branch: claude/project-thread-f5a9he
created: 2026-11-20
updated: 2026-11-23
archived_at: null
---

## Intent
The owner opens the inbox and sees every open owner-queue entry of every project, oldest first, with project, kind (word, decision, step, secret), source, item and age as property chips; the sidebar shows the count; the inbox is usable on a 390 px phone.

## Context
Roadmap item CMP-4 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-4: Decision inbox across projects
> - **Change ID:** `decision-inbox-across-projects`
> - **Status:** ready
> - **Outcome:** the owner opens the inbox and sees every open owner-queue entry of every project, oldest first, with project, kind (word, decision, step, secret), source, item and age as property chips; the sidebar shows the count; the inbox is usable on a 390 px phone.
> - **Prerequisites:** CMP-3
> - **Touches (estimate):** `app/(app)/inbox/**`, `src/inbox/**`, `src/shell/sidebar-inbox.tsx`, `messages/en.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Group by project as a view option, or age only in this item? (owner: research, PRD FR-4 challenge; blocks: no)
> - **Risk:** the first proof: the first time the owner sees value from real data; it goes right after the scan.
> - **Baseline:** no inbox; after: a test with fictional projects holding 2, 0 and 5 entries shows 7 rows oldest first; the phone check (`@softure-ai/testing`) passes at 390 px with 44 px targets.
> - **PRD refs:** FR-4, NFR-1, NFR-3, NFR-4, G-1
> - **Input:** context/changes/decision-inbox-across-projects/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/theme-notion`: `ListGroup` and `ListGroupHeading` (sticky group headings), `FilterChip`, `Status` (word plus icon), `Badge` tags, `touch-target` 44 px token, `TONE_*` classes.
- `owner_queue` entry shape (schema v1): `kind` (word, decision, step, secret), `source` (file `#` heading), `item`, `since` (YYYY-MM-DD), `text`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `app/(app)/inbox/**`, `src/inbox/**`, `src/shell/sidebar-inbox.tsx`, `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
- Frame skipped: the outcome is a direct PRD requirement (FR-4) with no competing framing.
