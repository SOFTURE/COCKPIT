---
change_id: queued-roadmap-promoted-to-work
title: "A queued roadmap, or one of its items, is promoted to work from the roadmap view"
status: archived
roadmap_item: null
branch: claude/project-thread-04rbzu
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
On the view of a queued roadmap (the later roadmap above all), the owner can send the whole roadmap, or one of its
open items, to work with one confirmed click. Each becomes exactly one `cockpit` issue in that project that tells the
project's coordinator what to do under the SOFTURE workflow; a second click while that issue is open finds it instead
of creating another, and the view shows the issue it became.

## Context
The owner asked for it on the later roadmap's view (2026-11-25): "promote the whole roadmap to work" and "promote a
single item to work". The later roadmap holds what the owner put off; the skills (WORKFLOW §5.1) say an item leaves
it when the owner raises it, and the later roadmap is never promoted as a whole as a file. Other queued roadmaps are
promoted with `softure-roadmap --promote <slug>` on the owner's word, and their entries are taken as in §5.1.

## Constraints
- The one write stays creating a labelled issue (NFR-7); no new token scope (NFR-5); never an unlabelled issue.
- Idempotent: one open issue per project, roadmap and item (or whole roadmap).
- Polish UI through the message layer; no change to panel-wide margins (another thread owns them).
- Skills are not changed; the issue text follows WORKFLOW §5.1 and §8.6 as they are (0.37).
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the owner named the outcome and the place; the mechanism is the existing issue write.
