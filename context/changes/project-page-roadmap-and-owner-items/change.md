---
change_id: project-page-roadmap-and-owner-items
title: "Each project is a page with roadmap items and stages, queued roadmaps, open changes, owner items, links"
status: new
roadmap_item: CMP-9
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner opens a project as a page: active roadmap items with their stages, queued roadmaps with their start condition, open changes, the owner's entries for this project (answerable as in the inbox) and links to the repository.

## Context
Roadmap item CMP-9 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-9: Project page: roadmap and owner items
> - **Change ID:** `project-page-roadmap-and-owner-items`
> - **Status:** ready
> - **Outcome:** the owner opens a project as a page: active roadmap items with their stages, queued roadmaps with their start condition, open changes, the owner's entries for this project (answerable as in the inbox) and links to the repository.
> - **Prerequisites:** CMP-8.
> - **Touches (estimate):** `app/(app)/projects/[slug]/page.tsx`, `src/project-page/**`, `messages/en.ts` (own keys).
> - **Size (owner-requested):** M
> - **Slice:** Project page
> - **Unknowns:** none
> - **Risk:** after the first usable slice: value 3 in the brief.
> - **Baseline:** no project page; after: a fixture project shows its items, stages and owner entries.
> - **PRD refs:** FR-10, G-3
> - **Input:** context/changes/project-page-roadmap-and-owner-items/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice: research gathers its findings when the slice is funded. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `app/(app)/projects/[slug]/page.tsx`, `src/project-page/**`, `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
