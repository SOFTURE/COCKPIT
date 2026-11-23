---
change_id: cli-release-ready
title: "(release) the CLI slice is ready to release and publish; nothing published without the owner's word"
status: archived
roadmap_item: CMP-18
branch: claude/project-thread-fj3z6c
created: 2026-11-20
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The CLI slice has its release notes and version and a publish dry run; nothing is published to npm without the owner's word.

## Context
Roadmap item CMP-18 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-18: CLI release ready
> - **Change ID:** `cli-release-ready`
> - **Status:** ready
> - **Outcome:** the CLI slice has its release notes and version and a publish dry run; nothing is published to npm without the owner's word.
> - **Prerequisites:** CMP-17.
> - **Touches (estimate):** `package.json` (version), `CHANGELOG.md`, `.github/workflows/publish-cli.yml`.
> - **Size:** S
> - **Unknowns:** none
> - **Risk:** the only npm publish in the roadmap.
> - **Baseline:** unpublished; after: `npm publish --dry-run` green.
> - **PRD refs:** FR-15
> - **Input:** context/archive/2026-11-20-cli-release-ready/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice (funded 2026-11-20): research gathers its findings when the item starts. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json` (version), `CHANGELOG.md`, `.github/workflows/publish-cli.yml`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- `frame` skipped: a packaging step the roadmap fixes (version, notes, a publish dry run); no competing framing (research.md, Framing).
- Archived 2026-11-23: the CLI slice is ready to publish (npm package `@softure-ai/cockpit`, publish dry run in CI, manual `publish-cli` workflow, version 0.5.0 and notes; 0.3.0 and 0.4.0 went to CMP-16 and CMP-11 first); not published (owner's word).
