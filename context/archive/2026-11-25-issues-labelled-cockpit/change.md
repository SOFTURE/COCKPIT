---
change_id: issues-labelled-cockpit
title: "Issues COCKPIT creates carry the label cockpit instead of owner-word"
status: archived
roadmap_item: null
branch: claude/project-thread-i9j1a3
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
The issues COCKPIT creates in a watched project (an inbox answer, a broadcast) carry the label `cockpit`, which says
where they come from, instead of `owner-word`, which reads as jargon. Nothing that already works breaks on the way.

## Context
The owner asked for it in chat. Watched projects pick these issues up by label: coordinators and the owner-word wake
routine of `@softure-ai/skills` list issues labelled `owner-word`, and the label must exist in the repository before
COCKPIT writes (FR-5: never an unlabelled issue). `@softure-ai/skills` 0.39.0 (SOFTURE/SKILLS#96) accepts both labels
and its installer creates `cockpit`; projects move to it one by one, as their package updates run.

## Constraints
- COCKPIT stays read-only toward watched repositories except creating issues (NFR-7): it never creates a label.
- A project that has only `owner-word` keeps getting answers and broadcasts; one with neither label still fails as
  `label_missing`.
- Issues created before the change (labelled `owner-word`) are still read: answers, broadcast done-state, history.
- The body markers (`<!-- owner-word: … -->`, the broadcast marker) stay as they are; skills parse them.
- Panel copy in Polish and English names the new label.
- No release, tag, publish or deploy.

## Notes
- 2026-11-25: `@softure-ai/skills` 0.39.0 was published from SOFTURE/SKILLS#99, which makes `cockpit` the only label
  and renames the answer marker (`<!-- cockpit: … -->`) and the wake key (`autonomy.cockpitWake`). Phase 2 of the
  plan aligns COCKPIT with it and keeps reading the older names.
- Frame skipped: the owner's explicit wording request; the outcome is not in doubt.
