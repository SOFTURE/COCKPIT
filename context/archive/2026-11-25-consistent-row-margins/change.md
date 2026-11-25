---
change_id: consistent-row-margins
title: "List rows share one inset, and the run-wide mode note reads naturally"
status: archived
roadmap_item: null
branch: claude/project-thread-bgtbyq
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
Every clickable list row in a card follows one rule: its hover and open background, the lines between rows and its
opened details sit exactly in the card's content box, and everything inside the row (the chevron, the text, the
details table) starts the same 8 px inside that box. The run-wide order "Owner at the keyboard" no longer shows a
raw monospace `Mode: owner` note under its value, and the item mode reads in the panel's language.

## Context
The owner reported (with screenshots) that margins do not match: on the roadmap view an opened item's highlight runs
to the content edge while its details are indented by a different amount, and on Broadcast the hover of a sent
broadcast sticks out past the list on both sides. The "Owner at the keyboard" order showed `Mode: owner` as an
indented code note, in English, repeating what the label already says.

## Constraints
- One rule for all clickable rows (roadmap items, queued roadmaps, sent broadcasts); static lists keep their text on
  the content edge.
- User-visible text goes through the message dictionaries, in English and Polish.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual fix the owner asked for with screenshots; the outcome is not in doubt.
