---
change_id: health-from-observability-adapter
title: "Projects that report health through observability show it in the overview and project page"
status: plan_reviewed
roadmap_item: CMP-21
branch: claude/project-thread-cudqww
created: 2026-11-20
updated: 2026-11-23
archived_at: null
---

## Intent
An optional adapter reads each project's health from its observability backend; the overview and project page show it; projects without it show nothing extra.

## Context
Roadmap item CMP-21 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-21: Health from observability adapter
> - **Change ID:** `health-from-observability-adapter`
> - **Status:** ready
> - **Outcome:** an optional adapter reads each project's health from its observability backend; the overview and project page show it; projects without it show nothing extra.
> - **Prerequisites:** CMP-8.
> - **Touches (estimate):** `src/adapters/contract.ts`, `src/adapters/observability/**`.
> - **Size:** M
> - **Unknowns:**
>   - Which health signal per project (an alert state, an error rate)? (owner: research; blocks: no)
> - **Risk:** first adapter defines the adapter contract the second reuses.
> - **Baseline:** no health shown; after: a fake backend's failing health shows on the fixture project.
> - **PRD refs:** FR-17, G-3
> - **Input:** context/changes/health-from-observability-adapter/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/observability` 0.8.8 exports OTLP traces, logs and metrics from the projects.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/adapters/contract.ts`, `src/adapters/observability/**`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- `frame` skipped: the outcome and the PRD acceptance (FR-17) are clear; research settled the one unknown (the signal).
