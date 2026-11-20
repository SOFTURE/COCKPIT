---
change_id: project-overview-with-status
title: "One row per project with roadmap X/N, queued, changes, waiting, release, quality review and a status"
status: new
roadmap_item: CMP-6
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner opens the overview: one row per project, grouped by status (broken, waiting for you, stalled, moving, idle), with active roadmap X/N and title, queued roadmaps, open changes, waiting count, last release from the forge, last CI and quality-review result; the sidebar shows each project's status icon.

## Context
Roadmap item CMP-6 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-6: Project overview with status
> - **Change ID:** `project-overview-with-status`
> - **Status:** ready
> - **Outcome:** the owner opens the overview: one row per project, grouped by status (broken, waiting for you, stalled, moving, idle), with active roadmap X/N and title, queued roadmaps, open changes, waiting count, last release from the forge, last CI and quality-review result; the sidebar shows each project's status icon.
> - **Prerequisites:** CMP-3
> - **Touches (estimate):** `app/(app)/overview/**`, `src/overview/**`, `src/status/**`, `src/forge/runs.ts`, `src/forge/releases.ts`, `src/scan/forge-facts.ts`, `src/shell/sidebar-projects.tsx` (status icon only), `messages/en.ts` (own keys).
> - **Size (owner-requested):** M
> - **Slice:** MVP (first usable slice)
> - **Unknowns:**
>   - Which workflow names identify CI, quality review and CI usage runs across projects (fixed names from the reusable workflows, or configurable)? (owner: research; blocks: no)
> - **Risk:** runs in parallel with CMP-4 and CMP-5 once CMP-3 is merged; no migration (forge facts ride the scan document).
> - **Baseline:** no overview; after: fixtures produce each of the five statuses, and the values match `npx softure-skills portfolio --json` on the same fictional projects.
> - **PRD refs:** FR-7, FR-8, NFR-1, G-3
> - **Input:** context/changes/project-overview-with-status/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `portfolio.py` (in `@softure-ai/skills`): "Last release comes from the forge when it can: the latest GitHub release ... else the highest `v*` tag ... else the value a closed roadmap recorded".
- `@softure-ai/quality-review` 0.3.0 and `@softure-ai/ci-usage` 0.1.3 run as reusable workflows in adopting projects; their runs are read from the workflow-runs API.

## Constraints
- Owns (estimate, from the roadmap's lanes): `app/(app)/overview/**`, `src/overview/**`, `src/status/**`, `src/forge/runs.ts`, `src/forge/releases.ts`, `src/scan/forge-facts.ts`, `src/shell/sidebar-projects.tsx` (status icon only), `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
