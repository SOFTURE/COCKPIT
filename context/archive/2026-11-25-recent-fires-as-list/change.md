---
change_id: recent-fires-as-list
title: "Recent fires as a list, two weeks back"
status: archived
roadmap_item: CT-15
branch: claude/project-thread-mjq2l1
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
A project's "Recent fires" card on the Routines tab lists one row per cockpit issue: the issue's number and title
and the date and time of its fire on the left, a green badge for a fired routine (red for a failed fire, grey for
no routine) on the right, with Retry where it applies. Only fires of the last 14 days show.

## Context
The owner (2026-11-25 13:04 Warsaw, F-14) sent a screenshot of the card: "#77 COCKPIT command: Test" as a heading
with "<routine>: Routine fired" under it, no date and no limit. Evidence:
`cockpit/evidence/recent-fires-as-list/01-recent-fires-before-1708-dark.webp`.

## Constraints
- The shared row style of `src/shell/row-inset.ts`; Notion design `Badge`.
- The window is 14 days from now, counted from the fire's time.
- Copy in both message dictionaries.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual fix the owner asked for with a screenshot; the outcome is not in doubt.
- A draft from the feedback session is in the project files, `cockpit/drafts/visual-fixes-draft.patch` (input, not a source of truth).

## Done
- **CT-15** `recent-fires-as-list`: a project's Recent fires card lists one row per cockpit issue fired in the last 14 days (SQL `since` filter plus `buildRoutinesTab`'s window): `#N title` and "fired <time>" on the left, a green Fired, red Failed, blue Waiting or grey No routine badge on the right with each routine's result in its tooltip, Retry under it (`RetryWakeForm`, extracted from `IssueWakeStatus`); `src/routines/fired-issue-row.tsx`; waiting: release; archived in `archive/2026-11-25-recent-fires-as-list/`
