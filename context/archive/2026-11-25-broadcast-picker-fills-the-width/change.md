---
change_id: broadcast-picker-fills-the-width
title: "The broadcast project picker fills the width and clears every project in one click"
status: archived
roadmap_item: null
branch: claude/project-thread-9k6lgp
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
On the Broadcast compose screen, the owner can unpick every project in one click (and pick them all again), and the
project checkboxes lay out in columns across the full width of the card instead of one long column, so the list does
not grow into an endless scroll as more projects are watched.

## Context
The owner reported the compose screen with twelve watched projects: every checkbox sits under the previous one in a
single column on a wide screen, and sending to only a few projects means unticking almost all of them one by one.

## Constraints
- One column on a phone; more columns as the width allows.
- User-visible text (buttons, labels) goes through the message dictionaries, in English and Polish.
- The form still posts one `project` field per picked project; sending stays the same.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a layout and convenience request from the owner; the outcome is not in doubt.
