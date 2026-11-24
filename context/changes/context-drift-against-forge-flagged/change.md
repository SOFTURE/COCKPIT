---
change_id: context-drift-against-forge-flagged
title: "Context drift against the forge is flagged"
status: planned
roadmap_item: CT-3
created: 2026-11-24
updated: 2026-11-24
---

## Intent
the overview and the project page flag a project whose forge has a release published after the rows its `context/state.json` still shows as `waiting: release` (the release was never settled into the context), or whose active roadmap has every row done and is still live instead of archived; the flag names which drift it is and what settles it (`wt-roadmap.py released <tag>`, or closing the roadmap).

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-3: Context drift against the forge is flagged
> - **Change ID:** `context-drift-against-forge-flagged`
> - **Status:** ready
> - **Outcome:** the overview and the project page flag a project whose forge has a release published after the
>   rows its `context/state.json` still shows as `waiting: release` (the release was never settled into the context),
>   or whose active roadmap has every row done and is still live instead of archived; the flag names which drift it
>   is and what settles it (`wt-roadmap.py released <tag>`, or closing the roadmap).
> - **Prerequisites:** CT-5 (the project page's tabs, where the flag sits)
> - **Touches (estimate):** `src/drift/**` (new), `src/overview/**` (a flag on the row), `src/project-page/**` (a
>   flag in the header), `src/state/state-schema.ts` (read only), `modules/overview/migrations/0003_*` (only if the
>   latest release must be stored), `messages/en.ts` and `messages/pl.ts` (own keys).
> - **Size:** S
> - **Unknowns:**
>   - What "release newer than the rows" compares: the newest release's `published_at` against each row's date in
>     `done_code (<date>; waiting: release)`, or the release's commit against the rows' merge commits? Recommended:
>     the dates, which `state.json` already carries. (owner: research; blocks: no)
>   - Is a roadmap whose rows are all `done_code (waiting: release)` "done and still live"? Recommended: no, only when
>     every row is `done`; waiting for a release is the normal state before the close. (owner: research; blocks: no)
> - **Risk:** a false flag on every project right after a release, until its session settles the context; the flag
>   says so instead of looking like an error.
> - **Baseline:** today drift shows only when someone reads the roadmap against the releases; after: a test with
>   fictional projects (settled, released but not settled, finished roadmap still live) shows two flags and one clean
>   row.
> - **PRD refs:** F-3, FR-7, FR-10
> - **Input:** context/changes/context-drift-against-forge-flagged/change.md

Findings gathered while recording it (2026-11-24):
- `context/state.json` schema 2 rows carry `done_code (<date>; waiting: release)` and the owner queue a `release:`
  word entry (`.claude/skills/softure-doctor/scripts/context_state.py`, `_owner_entries`); COCKPIT reads it in
  `src/state/state-schema.ts`.
- Releases are already read for the history page (`src/project-page/history/**`).
- The settle step after a release is `wt-roadmap.py released <tag>` (SOFTURE/SKILLS#82, closed); drift appears when
  no session ran it.

## Constraints
- Owns exclusively (estimate): `src/drift/**` (new), `src/overview/**` (a flag on the row), `src/project-page/**` (a flag in the header), `src/state/state-schema.ts` (read only), `modules/overview/migrations/0003_*` (only if the latest release must be stored).
- Shared, append only: `messages/en.ts` and `messages/pl.ts` (own keys in both).
- Starts after CT-5 merges: both edit the project page.
- Read-only toward watched repositories (NFR-7); no release or deploy.
