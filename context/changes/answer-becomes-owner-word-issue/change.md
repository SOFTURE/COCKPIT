---
change_id: answer-becomes-owner-word-issue
title: "Yes / No / Later with a note creates one owner-word issue; entry shows sent, then done"
status: new
roadmap_item: CMP-5
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner answers an entry Yes, No or Later with an optional note; exactly one issue labelled `owner-word` is created in that project, its body carrying `<!-- owner-word: {"entry": "<id>", "answer": "yes|no|later"} -->` with the entry's stable `owner_queue[].id`; the entry shows "sent" with the link, "done" once the issue is closed, and "the entry changed since" when the project rewords it after the answer (same id, new text).

## Context
Roadmap item CMP-5 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-5: An answer becomes an owner-word issue
> - **Change ID:** `answer-becomes-owner-word-issue`
> - **Status:** ready
> - **Outcome:** the owner answers an entry Yes, No or Later with an optional note; exactly one issue labelled `owner-word` is created in that project, its body carrying `<!-- owner-word: {"entry": "<id>", "answer": "yes|no|later"} -->` with the entry's stable `owner_queue[].id`; the entry shows "sent" with the link, "done" once the issue is closed, and "the entry changed since" when the project rewords it after the answer (same id, new text).
> - **Prerequisites:** CMP-4
> - **Touches (estimate):** `src/decisions/**`, `src/forge/issues.ts`, `app/(app)/inbox/answer/**`, `db/migrations/` (one: answers with who answered), `messages/en.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Does an owner-word issue created outside COCKPIT with the same marker count as the answer (FR-6 "sent" too)? (owner: research; blocks: no)
> - **Risk:** the only write COCKPIT makes; double answers or a write outside issue creation would break the core rule and NFR-7.
> - **Baseline:** answers travel as hand-written prompts; after: a test answers an entry twice at once and finds one issue on the fake forge whose body carries the entry id and the answer, then closes it and sees "done"; a reworded entry with the same id shows "the entry changed since"; a test fails on any other writing request.
> - **PRD refs:** FR-5, FR-6, NFR-7, G-2, G-4
> - **Input:** context/changes/answer-becomes-owner-word-issue/change.md

Findings gathered while recording the roadmap (2026-11-20):
- WORKFLOW §8.6: an issue labelled `owner-word` "is the owner's word in writing, equal to the same sentence in the main chat"; the coordinator "comments what it did ... and closes the issue"; owner-word issues "live on the forge, not" in `state.json`.
- Gap filed: SOFTURE/SKILLS#48 (stable `owner_queue` ids, a machine-readable owner-word body). Until it lands, COCKPIT fingerprints entries itself (shape notes, Rabbit holes: "accept").
- Re-checked 2026-11-20 (roadmap v2): SOFTURE/SKILLS#48 is still open; `@softure-ai/skills` 0.23.0 closed only its doctor point. Entries still have no stable id and the owner-word body has no machine-readable marker, so the fingerprint stays.
- Re-checked 2026-11-20 (roadmap v3): SOFTURE/SKILLS#48 is closed and released in `@softure-ai/skills` 0.24.0. Every `owner_queue` entry has a stable `id` (`oq-…`, schema 2), kept when only its wording changes or it moves to another heading of the same file (#56). An owner-word issue names the entry it answers with `<!-- owner-word: {"entry": "<id>", "answer": "yes|no|later"} -->` next to the prose; the coordinator settles that entry and cites the issue (`— done: #N`, `— declined: #N`, or `(later: #N)` while it stays open) (#57, WORKFLOW §8.6). COCKPIT uses the id and writes that marker, so it needs no fingerprint of its own.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/decisions/**`, `src/forge/issues.ts`, `app/(app)/inbox/answer/**`, `db/migrations/` (one: answers with who answered), `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
