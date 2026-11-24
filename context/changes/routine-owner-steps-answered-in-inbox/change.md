---
change_id: routine-owner-steps-answered-in-inbox
title: "Routine owner steps are answered in the inbox"
status: new
roadmap_item: CT-4
created: 2026-11-24
updated: 2026-11-24
---

## Intent
the owner steps the nightly package-update routine records (a held package waiting for the owner, a new secret a bump needs) appear in the inbox like any other entry, and the owner settles each with a "done" answer that becomes one owner-word issue the project acts on, as SOFTURE/SKILLS#86 defines it.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-4: Routine owner steps are answered in the inbox
> - **Change ID:** `routine-owner-steps-answered-in-inbox`
> - **Status:** blocked (SOFTURE/SKILLS#86)
> - **Outcome:** the owner steps the nightly package-update routine records (a held package waiting for the owner, a
>   new secret a bump needs) appear in the inbox like any other entry, and the owner settles each with a "done" answer
>   that becomes one owner-word issue the project acts on, as SOFTURE/SKILLS#86 defines it.
> - **Prerequisites:** SOFTURE/SKILLS#86 released in `@softure-ai/skills` and the skills bumped here
> - **Touches (estimate):** `src/inbox/**` (the "done" answer), `src/decisions/answer-entry.ts`,
>   `src/inbox/owner-word-marker.ts` (the marker's answer), `src/state/**` (the new owner-queue entries),
>   `package.json` (skills bump), `messages/en.ts` and `messages/pl.ts` (own keys).
> - **Size:** S
> - **Unknowns:**
>   - How SOFTURE/SKILLS#86 records the routine's owner steps (a `## Before the next release` step, or an issue listed
>     in `context/workflow.json`) and whether the owner-word marker gains a `done` answer (owner: research; blocks: yes).
> - **Risk:** the answer's shape is decided outside this repository; building it before the release would guess it.
> - **Baseline:** today a bump's new secret reaches the owner only by hand; after: a test with a fictional project
>   whose state lists a routine owner step shows it in the inbox, answers "done" and finds one owner-word issue with
>   the marker SOFTURE/SKILLS#86 defines.
> - **PRD refs:** F-4, FR-4, FR-5
> - **Input:** context/changes/routine-owner-steps-answered-in-inbox/change.md

Findings gathered while recording it (2026-11-24):
- SOFTURE/SKILLS#86 (open): "a bump that needs an owner-only step (a new secret, a variable, a data decision) is
  either merged with the step recorded where the owner sees it: `## Before the next release` of the live roadmap,
  or, with no live roadmap, an owner-word-style issue in the project's repository recorded in
  `context/workflow.json` … or held with such an issue … The state script picks those issues and the `Before the
  next release` steps up into `owner_queue`, and settles a secret step once the owner confirms it." It also names
  `SECRET_RE` classifying `SOFTURE_EMAIL_KEY_SECRET` as a plain step.
- Today answers are `yes | no | later` (`src/inbox/owner-word-marker.ts`, `src/decisions/answer-entry.ts`).

## Constraints
- Owns exclusively (estimate): `src/inbox/**` (the "done" answer), `src/decisions/answer-entry.ts`, `src/inbox/owner-word-marker.ts` (the marker's answer), `src/state/**` (the new owner-queue entries), `package.json` (skills bump).
- Shared, append only: `messages/en.ts` and `messages/pl.ts` (own keys in both).
- Read-only toward watched repositories (NFR-7); no release or deploy.
