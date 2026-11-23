---
change_id: doctor-status-per-project
title: "Each project shows whether its context/ contract passes the doctor"
status: plan_reviewed
roadmap_item: CMP-7
branch: claude/project-thread-1ooxjm
created: 2026-11-20
updated: 2026-11-23
archived_at: null
---

## Intent
Each project's row shows the doctor result (OK, or the number of failures), read from the check run `context-doctor` on the head of its main branch (`ok`, `failing` with the failure codes and their count, `pending`, `missing`), as `@softure-ai/skills` 0.24.0 publishes it (the annotation `context-doctor failure codes`); a failing doctor makes the project broken.

## Context
Roadmap item CMP-7 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-7: Doctor status per project
> - **Change ID:** `doctor-status-per-project`
> - **Status:** ready
> - **Outcome:** each project's row shows the doctor result (OK, or the number of failures), read from the check run `context-doctor` on the head of its main branch (`ok`, `failing` with the failure codes and their count, `pending`, `missing`), as `@softure-ai/skills` 0.24.0 publishes it (the annotation `context-doctor failure codes`); a failing doctor makes the project broken.
> - **Prerequisites:** CMP-6
> - **Touches (estimate):** `src/doctor/**`, `src/scan/doctor-step.ts`, `src/forge/runs.ts` (check runs of a commit), `messages/en.ts` (own keys); no python3 or git in the runtime.
> - **Size:** S
> - **Unknowns:** none
> - **Risk:** small; watched projects without the `context-doctor` job show `missing` until they add it (the skills installer prints the job).
> - **Baseline:** doctor column shows "n/a"; after: fake-forge fixtures with a failing, a passing, a pending and no `context-doctor` check run show failing with its codes and count, OK, pending and missing.
> - **PRD refs:** FR-7, FR-8
> - **Input:** context/changes/doctor-status-per-project/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `doctor.py [--root <dir>] [--json]` ships in `@softure-ai/skills`; `portfolio.py` already runs it "through git (a shallow, sparse, blob-less clone into a temporary folder for a remote)".
- Gap filed: SOFTURE/SKILLS#48 point 3 (doctor result readable through the forge API).
- Re-checked 2026-11-20 (roadmap v2): `@softure-ai/skills` 0.23.0 (#51, #54) runs the doctor in a CI job with the fixed name `context-doctor`, and `portfolio --source api` reads that check run on the main branch's head as `ok`, `failing`, `pending` or `missing`. COCKPIT reads it the same way, so no checkout, python3 or git is needed at runtime. SOFTURE/SKILLS#48 itself stays open for its other points.
- Re-checked 2026-11-20 (roadmap v3): `@softure-ai/skills` 0.24.0 (#58) writes the failure codes on the `context-doctor` check run in GitHub Actions: the annotation `context-doctor failure codes` lists every code with its count, then one annotation per failure, and the job summary holds the same table; `portfolio --source api` shows `failing: <codes>` and adds `doctor_check_codes` to its JSON. COCKPIT reads the same annotations, so the count needs no checkout.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/doctor/**`, `src/scan/doctor-step.ts`, `src/forge/runs.ts` (check runs of a commit, shared with CMP-6), `messages/en.ts` (own keys); no python3 or git in the runtime.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
