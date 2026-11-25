---
change_id: digest-release-ready
title: "(release) the digest slice is ready to release; nothing released without the owner's word"
status: archived
roadmap_item: CMP-13
branch: claude/project-thread-0xe3hj
created: 2026-11-20
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The digest slice has its release notes, version and secret names, passes the deploy dry run, and waits for the owner's word.

## Context
Roadmap item CMP-13 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-13: Digest release ready
> - **Change ID:** `digest-release-ready`
> - **Status:** ready
> - **Outcome:** the digest slice has its release notes, version and secret names, passes the deploy dry run, and waits for the owner's word.
> - **Prerequisites:** CMP-12.
> - **Touches (estimate):** `package.json` (version), `CHANGELOG.md`, `compose.yaml` (secret names).
> - **Size:** S
> - **Unknowns:** none
> - **Risk:** closes the slice.
> - **Baseline:** unreleased; after: dry run green, release notes list CMP-12.
> - **PRD refs:** FR-9
> - **Input:** context/changes/digest-release-ready/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json` (version), `CHANGELOG.md`, `compose.yaml` (secret names).
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- `frame` skipped: a packaging step the roadmap fixes; no competing framing (research.md, Framing).
- Archived 2026-11-23: the digest slice is ready to release (version 0.2.0, notes, optional digest settings for the app and the worker, dry run green); not released (owner's word).
