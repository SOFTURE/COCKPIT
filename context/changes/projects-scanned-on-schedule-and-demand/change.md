---
change_id: projects-scanned-on-schedule-and-demand
title: "Every project is read on a schedule and on demand; last read time and failures shown"
status: plan_reviewed
roadmap_item: CMP-3
branch: claude/project-thread-f5a9he
created: 2026-11-20
updated: 2026-11-23
archived_at: null
---

## Intent
Every watched project's `context/state.json` and its owner-word issues are read every 30 minutes (15 to 60, configurable) and when the owner presses "Scan now"; each project shows when it was last read and why a read failed, and one failing project never stops the others.

## Context
Roadmap item CMP-3 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-3: Projects scanned on a schedule and on demand
> - **Change ID:** `projects-scanned-on-schedule-and-demand`
> - **Status:** ready
> - **Outcome:** every watched project's `context/state.json` and its owner-word issues are read every 30 minutes (15 to 60, configurable) and when the owner presses "Scan now"; each project shows when it was last read and why a read failed, and one failing project never stops the others.
> - **Unlocks:** CMP-4 (inbox reads the stored state), CMP-6 (overview adds forge facts to the same scan).
> - **Prerequisites:** CMP-2
> - **Touches (estimate):** `src/scan/**`, `src/state/**` (schema check: `schema_version` 2 with an `id` per owner-queue entry), `softure.config.ts` (jobs schedule), `app/(app)/scan-status/**`, `db/migrations/` (one: scan results stored as one document per project and scan).
> - **Size:** M
> - **Unknowns:**
>   - Does a stored document per project and scan stay small enough for 30 projects over months, or does only the latest need keeping? (owner: research; blocks: no)
> - **Risk:** the riskiest technical step: the state contract and the forge limits meet here; a wrong reader here makes every screen wrong. A project still on `schema_version` 1 (no entry ids) is shown as "state too old" with the step to regenerate it (`npx softure-skills state`), not guessed at.
> - **Baseline:** no reads; after: a test runs the scheduled scan over three fictional projects (one failing) and finds two read and one failure with its reason; the run uses the jobs schedule once per period.
> - **PRD refs:** FR-3, NFR-2, NFR-7
> - **Input:** context/changes/projects-scanned-on-schedule-and-demand/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/jobs` 0.1.14: "recurring schedules that run once per period however many workers run", `schedules.<queue>.every` (`1m` to `7d`), `runScheduleNow` for on-demand runs, pacing per queue (`rateLimit`), retries with back-off.
- WORKFLOW §12.3: `portfolio --source api` reads only `context/state.json` through the API; COCKPIT's reader must agree with `npx softure-skills portfolio --json`.
- Owner's brief: "GraphQL may be unavailable in some environments, so do not depend on it."

- Re-checked 2026-11-20 (roadmap v3): `@softure-ai/skills` 0.24.0 writes `context/state.json` with `schema_version` 2 and a stable `id` per `owner_queue` entry; a version 1 file gains the ids on its next write (#56). The scan reads version 2 and shows a version 1 project as "state too old" with the step `npx softure-skills state`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/scan/**`, `src/state/**` (schema check), `softure.config.ts` (jobs schedule), `app/(app)/scan-status/**`, `db/migrations/` (one: scan results stored as one document per project and scan).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
- Frame skipped: the outcome is a direct PRD requirement (FR-3) with no competing framing.
