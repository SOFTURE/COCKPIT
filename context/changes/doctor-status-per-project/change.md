---
change_id: doctor-status-per-project
title: "Each project shows whether its context/ contract passes the doctor"
status: new
roadmap_item: CMP-7
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
Each project's row shows the doctor result (OK, or the number of failures), read by running the packaged doctor on a sparse checkout of `context/` of its main branch; a failing doctor makes the project broken.

## Context
Roadmap item CMP-7 of `context/foundation/roadmap.md` (cockpit-v1, v1), quoted:

> ### CMP-7: Doctor status per project
> - **Change ID:** `doctor-status-per-project`
> - **Status:** ready
> - **Outcome:** each project's row shows the doctor result (OK, or the number of failures), read by running the packaged doctor on a sparse checkout of `context/` of its main branch; a failing doctor makes the project broken.
> - **Prerequisites:** CMP-6
> - **Touches (estimate):** `src/doctor/**`, `src/scan/doctor-step.ts`, `messages/en.ts` (own keys); the runtime image's python3 and git are added by CMP-8, which owns the `Dockerfile`.
> - **Size (owner-requested):** S
> - **Slice:** MVP (first usable slice)
> - **Unknowns:**
>   - Does a sparse, blob-less clone of `context/` stay under a few seconds per project with the token over HTTPS? (owner: research; blocks: no)
> - **Risk:** small, but it needs python3 in the runtime; switch to the forge check once SOFTURE/SKILLS#48 lands.
> - **Baseline:** doctor column shows "n/a"; after: a fixture repository with a drifted `context/` shows the failure count, a clean one shows OK.
> - **PRD refs:** FR-7, FR-8
> - **Input:** context/changes/doctor-status-per-project/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `doctor.py [--root <dir>] [--json]` ships in `@softure-ai/skills`; `portfolio.py` already runs it "through git (a shallow, sparse, blob-less clone into a temporary folder for a remote)".
- Gap filed: SOFTURE/SKILLS#48 point 3 (doctor result readable through the forge API).

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/doctor/**`, `src/scan/doctor-step.ts`, `messages/en.ts` (own keys); the runtime image's python3 and git are added by CMP-8, which owns the `Dockerfile`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
