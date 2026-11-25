---
change_id: routine-owner-steps-answered-in-inbox
title: "Routine owner steps are answered in the inbox"
status: archived
branch: claude/project-thread-4ble7b
roadmap_item: CT-4
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
the owner steps the nightly package-update routine records (a held package waiting for the owner, a new secret a bump needs) appear in the inbox like any other entry, and the owner settles each with a "done" answer that becomes one cockpit issue the project acts on, as SOFTURE/SKILLS#86 defines it.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-4: Routine owner steps are answered in the inbox
> - **Change ID:** `routine-owner-steps-answered-in-inbox`
> - **Status:** ready
> - **Outcome:** the owner steps the nightly package-update routine records (a held package waiting for the owner, a
>   new secret a bump needs) appear in the inbox like any other entry, and the owner settles each with a "done" answer
>   that becomes one cockpit issue the project acts on, as SOFTURE/SKILLS#86 defines it.
> - **Prerequisites:** SOFTURE/SKILLS#86 released in `@softure-ai/skills` and the skills bumped here
> - **Touches (estimate):** `src/inbox/**` (the "done" answer), `src/decisions/answer-entry.ts`,
>   `src/inbox/cockpit-marker.ts` (the marker's answer), `src/state/**` (the new owner-queue entries),
>   `package.json` (skills bump), `messages/en.ts` and `messages/pl.ts` (own keys).
> - **Size:** S
> - **Unknowns:**
>   - How SOFTURE/SKILLS#86 records the routine's owner steps (a `## Before the next release` step, or an issue listed
>     in `context/workflow.json`) and whether the cockpit marker gains a `done` answer (owner: research; blocks: yes).
> - **Risk:** the answer's shape is decided outside this repository; building it before the release would guess it.
> - **Baseline:** today a bump's new secret reaches the owner only by hand; after: a test with a fictional project
>   whose state lists a routine owner step shows it in the inbox, answers "done" and finds one cockpit issue with
>   the marker SOFTURE/SKILLS#86 defines.
> - **PRD refs:** F-4, FR-4, FR-5
> - **Input:** context/changes/routine-owner-steps-answered-in-inbox/change.md

Findings gathered while recording it (2026-11-24):
- SOFTURE/SKILLS#86 (open): "a bump that needs an owner-only step (a new secret, a variable, a data decision) is
  either merged with the step recorded where the owner sees it: `## Before the next release` of the live roadmap,
  or, with no live roadmap, a cockpit-style issue in the project's repository recorded in
  `context/workflow.json` … or held with such an issue … The state script picks those issues and the `Before the
  next release` steps up into `owner_queue`, and settles a secret step once the owner confirms it." It also names
  `SECRET_RE` classifying `SOFTURE_EMAIL_KEY_SECRET` as a plain step.
- Unblocked 2026-11-24: SOFTURE/SKILLS#86 is closed and released in `@softure-ai/skills` 0.36.0, already in
  `package.json`. `routines/package-updates.md` §5 there: a bump's owner step is a `## Before the next release` line
  (live roadmap) or a cockpit-style issue plus `{ "package", "version", "issue", "since", "step" }` in
  `routines.packageUpdates.ownerSteps`; an owner hold is `routines.packageUpdates.hold` with an `owner` field. The
  state script lists all three in `owner_queue` (`kind: "secret"` when the step names a secret, key, token or
  password), and a cockpit answer to the entry's `id` settles it (`yes` sets `"confirmed": "#N"`); no new `done`
  answer exists in the marker, so "done" is likely the inbox wording of `yes` for these entries.
- Today answers are `yes | no | later` (`src/inbox/cockpit-marker.ts`, `src/decisions/answer-entry.ts`).

## Constraints
- Owns exclusively (estimate): `src/inbox/**` (the "done" answer), `src/decisions/answer-entry.ts`, `src/inbox/cockpit-marker.ts` (the marker's answer), `src/state/**` (the new owner-queue entries), `package.json` (skills bump).
- Shared, append only: `messages/en.ts` and `messages/pl.ts` (own keys in both).
- Read-only toward watched repositories (NFR-7); no release or deploy.

## Notes
- Unblocked 2026-11-24: SOFTURE/SKILLS#86 is closed and released in `@softure-ai/skills` 0.36.0, which `package.json`
  already pins (`^0.36.0`), so no skills bump is needed in this change.
- `frame` skipped: research confirmed the framing (the contract keeps `yes`; the change is how COCKPIT words and
  routes it), no competing explanation to test.

## Roadmap handoff
- **Done:** an owner step or hold the package-update routine records (`context/workflow.json` → `routines.packageUpdates`) shows in the inbox; a step or secret is answered "Done" (marker `yes`), and the cockpit issue tells the project to set `"confirmed"` on an `ownerSteps` entry or that the next package-update run applies an owner hold; no migration, no new permission
