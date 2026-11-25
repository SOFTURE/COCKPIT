---
change_id: delete-sent-broadcast
title: "A sent broadcast can be deleted from COCKPIT"
status: archived
roadmap_item: null
branch: claude/project-thread-5q63k1
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
On the Broadcast screen, every row of the sent broadcasts list has a delete (trash can) button. After a confirm step,
the broadcast and its per-project sends are removed from COCKPIT's history. The rows of that list also line up with
the card: the hover background, the row padding and the dividers stay inside the card's content margins, and the text
sits inset inside the highlight.

## Context
The owner sent a few test broadcasts and wants to remove them from the list. The owner also reported list row margins
that do not line up with the card; that is fixed app-wide in a separate change, so this one keeps the row styling as it
is (only what the button needs).

## Constraints
- COCKPIT is read-only toward the watched repositories except for creating issues (AGENTS.md): deleting a broadcast
  never closes or edits the issues it created. The confirm step says so.
- Deleting needs a signed-in member, like sending.
- User-visible text goes through the message dictionaries, in English and Polish.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a direct owner request with a clear outcome.
