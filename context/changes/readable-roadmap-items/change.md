---
change_id: readable-roadmap-items
title: "Roadmap view: items read cleanly, owner step stands out, overview progress on the header row"
status: planned
roadmap_item: null
branch: claude/project-thread-mp61nw
created: 2026-11-24
updated: 2026-11-24
---

## Intent
An item of the roadmap view reads at a glance: closed, it shows its ID, title, status, stage and at most two lines
of its outcome, plus an "Owner step" badge when the item asks something of the owner; opened, it shows the owner's
step first and highlighted, then one table of the short facts (prerequisites, size, priority, change, mode) with no
field shown twice, then the long fields as labelled paragraphs. HTML comments from the roadmap file (language
markers such as `<!-- language: pl -->`) never reach the screen. The overview card shows its progress and status
counts on the header row, right-aligned, instead of on a line of their own.

## Context
The owner opened an item of a queued roadmap of a watched project and found it unreadable: the outcome was a long
paragraph under the title with the owner's step buried in it, the change ID appeared twice (table and field), the
"Depends on" field repeated the prerequisites, and a feedback field showed raw `<!-- language: pl -->` comments.
The roadmap's own fields are free-form markdown written by `softure-roadmap`, so the view must stay tolerant.

## Constraints
- Read-only toward watched repositories; no new write.
- Inline markdown stays text-only (no HTML rendered from a project's files).
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the owner's screenshots state the expected result.
