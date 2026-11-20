---
change_id: project-page-release-ready
title: "(release) the project-page slice is ready to release; nothing released without the owner's word"
status: new
roadmap_item: CMP-11
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The project-page slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.

## Context
Roadmap item CMP-11 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-11: Project page release ready
> - **Change ID:** `project-page-release-ready`
> - **Status:** ready
> - **Outcome:** the project-page slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.
> - **Prerequisites:** CMP-10.
> - **Touches (estimate):** `package.json` (version), `CHANGELOG.md`.
> - **Size (owner-requested):** S
> - **Slice:** Project page
> - **Unknowns:** none
> - **Risk:** closes the slice.
> - **Baseline:** unreleased; after: dry run green, release notes list CMP-9 and CMP-10.
> - **PRD refs:** FR-9
> - **Input:** context/changes/project-page-release-ready/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice: research gathers its findings when the slice is funded. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json` (version), `CHANGELOG.md`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
