---
change_id: delete-sent-broadcast
title: "A sent broadcast can be deleted from COCKPIT, and its list rows sit inside the card's margins"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-5q63k1
created: 2026-11-25
updated: 2026-11-25
---

## Intent
On the Broadcast screen, every row of the sent broadcasts list has a delete (trash can) button. After a confirm step,
the broadcast and its per-project sends are removed from COCKPIT's history. The rows of that list also line up with
the card: the hover background, the row padding and the dividers stay inside the card's content margins, and the text
sits inset inside the highlight.

## Context
The owner sent a few test broadcasts and wants to remove them from the list. The owner also reported that the hover
background of a row sticks out past the card's content edge, so the highlight and the header text do not line up.

## Constraints
- COCKPIT is read-only toward the watched repositories except for creating issues (AGENTS.md): deleting a broadcast
  never closes or edits the issues it created. The confirm step says so.
- Deleting needs a signed-in member, like sending.
- User-visible text goes through the message dictionaries, in English and Polish.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a direct owner request with a clear outcome.
