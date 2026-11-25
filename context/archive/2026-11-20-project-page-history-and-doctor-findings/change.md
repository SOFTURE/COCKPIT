---
change_id: project-page-history-and-doctor-findings
title: "A project page shows recent merges, releases, CI and quality-review runs and doctor findings"
status: archived
roadmap_item: CMP-10
branch: claude/project-thread-7fv7ho
created: 2026-11-20
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
A project page shows recent merges and releases, the latest CI and quality-review runs and the doctor's findings with their codes (one annotation per failure on the `context-doctor` check run).

## Context
Roadmap item CMP-10 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-10: Project page: history and doctor findings
> - **Change ID:** `project-page-history-and-doctor-findings`
> - **Status:** ready
> - **Outcome:** a project page shows recent merges and releases, the latest CI and quality-review runs and the doctor's findings with their codes (one annotation per failure on the `context-doctor` check run).
> - **Prerequisites:** CMP-9.
> - **Touches (estimate):** `app/(app)/projects/[slug]/history/**`, `src/project-page/history/**`, `src/forge/merges.ts`.
> - **Size:** M
> - **Unknowns:** none
> - **Risk:** reads more forge endpoints per project; checks NFR-2 again.
> - **Baseline:** history not shown; after: a fixture project shows its last merges, releases, runs and findings.
> - **PRD refs:** FR-11, NFR-2
> - **Input:** context/changes/project-page-history-and-doctor-findings/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `app/(app)/projects/[slug]/history/**`, `src/project-page/history/**`, `src/forge/merges.ts`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- Frame skipped: the PRD (FR-11) states the outcome and its acceptance; the forge reads already exist for the overview and the doctor, so there is no competing framing to test.
