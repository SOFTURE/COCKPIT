---
change_id: fire-status-beside-send-state
title: "A fire reads only its state, next to "Sent""
status: new
roadmap_item: CT-13
branch: claude/project-thread-g7uwem
created: 2026-11-25
updated: 2026-11-25
---

## Intent
On a broadcast's page each project's fire reads "Routine fired", "No routine to fire" or the failure, on the
same line as "Sent"; the routine's name moves to the tooltip, everywhere a fire shows.

## Context
The owner (2026-11-25 12:57 Warsaw, F-12): "next to Sent it is enough to say the routine fired, or that there is
none". Evidence: `cockpit/evidence/fire-status-beside-send-state/01-fire-line-before-1078-dark.webp`.

## Constraints
- The failure keeps its HTTP status and reason.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual fix the owner asked for with screenshots; the outcome is not in doubt.
