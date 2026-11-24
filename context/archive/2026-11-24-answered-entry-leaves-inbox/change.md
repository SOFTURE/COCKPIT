---
change_id: answered-entry-leaves-inbox
title: "Inbox: an entry the owner answered is never asked again, and a Later moves to the later roadmap"
status: archived
roadmap_item: null
branch: claude/project-thread-43n2l2
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
Once the owner answers an owner-queue entry in COCKPIT, the entry stops waiting for them. A project's own text
change while settling the answer never brings it back as "changed since your answer", and the issue an answer
becomes tells the project the settle rules of SOFTURE/SKILLS 0.37.0: every answer takes the entry off the queue, a
Later moves the item to `roadmaps/roadmap-later.md` as a new item under that roadmap's own numbering.

## Context
In a watched project the owner answered one entry Later and one Yes. Following the issue footer and WORKFLOW §8.6
(before 0.37.0) the project kept the Later entry open with `(later: #54, …)` inside the text, and re-worded the Yes
entry to list what was left, citing `#57`. Both kept their id with a new text, so the inbox showed both as changed since
the answer and asked again. The deferred detection added earlier (`(later: #N)` at the end
of the text) did not match a mark inside the text. The settle rules were fixed in SOFTURE/SKILLS#94 (#93).

## Constraints
- No release, tag, publish or deploy (the coordinator deploys once at the end).
- Stay out of CT-8 (entry identity keyed on project and id) and keep the CT-4 edit of `getSettleSteps` mergeable.

## Notes
- Frame skipped: the owner stated the required process; the question is only where the code misses it.
- Research done inline (two files): findings in `research.md`.

## Done
- An answered entry that its project re-words while settling the answer (the text cites the issue) stays answered;
  a `(later: #N` mark inside the text puts the entry off; the issue footer carries the SOFTURE/SKILLS 0.37.0 settle
  rules (a Later moves to `roadmaps/roadmap-later.md` under a new ID; never re-word the entry).
