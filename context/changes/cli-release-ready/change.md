---
change_id: cli-release-ready
title: "(release) the CLI slice is ready to release and publish; nothing published without the owner's word"
status: new
roadmap_item: CMP-18
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The CLI slice has its release notes and version and a publish dry run; nothing is published to npm without the owner's word.

## Context
Roadmap item CMP-18 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-18: CLI release ready
> - **Change ID:** `cli-release-ready`
> - **Status:** ready
> - **Outcome:** the CLI slice has its release notes and version and a publish dry run; nothing is published to npm without the owner's word.
> - **Prerequisites:** CMP-17.
> - **Touches (estimate):** `package.json` (version), `CHANGELOG.md`, `.github/workflows/publish-cli.yml`.
> - **Size (owner-requested):** S
> - **Slice:** CLI
> - **Unknowns:** none
> - **Risk:** the only npm publish in the roadmap.
> - **Baseline:** unpublished; after: `npm publish --dry-run` green.
> - **PRD refs:** FR-15
> - **Input:** context/changes/cli-release-ready/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice: research gathers its findings when the slice is funded. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json` (version), `CHANGELOG.md`, `.github/workflows/publish-cli.yml`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
