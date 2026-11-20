---
change_id: digest-release-ready
title: "(release) the digest slice is ready to release; nothing released without the owner's word"
status: new
roadmap_item: CMP-13
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The digest slice has its release notes, version and secret names, passes the deploy dry run, and waits for the owner's word.

## Context
Roadmap item CMP-13 of `context/foundation/roadmap.md` (cockpit-v1, v1), quoted:

> ### CMP-13: Digest release ready
> - **Change ID:** `digest-release-ready`
> - **Status:** blocked (funding: slice not funded yet)
> - **Outcome:** the digest slice has its release notes, version and secret names, passes the deploy dry run, and waits for the owner's word.
> - **Prerequisites:** CMP-12; the owner funds the digest slice.
> - **Touches (estimate):** `package.json` (version), `CHANGELOG.md`, `compose.yaml` (secret names).
> - **Size (owner-requested):** S
> - **Slice:** Digest
> - **Unknowns:**
>   - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
> - **Risk:** closes the slice.
> - **Baseline:** unreleased; after: dry run green, release notes list CMP-12.
> - **PRD refs:** FR-9
> - **Input:** context/changes/digest-release-ready/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Later slice: research gathers its findings when the slice is funded. Inputs: `context/foundation/prd.md` (the PRD refs above) and `context/foundation/shape-notes.md`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json` (version), `CHANGELOG.md`, `compose.yaml` (secret names).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
