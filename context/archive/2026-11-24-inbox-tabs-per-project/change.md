---
change_id: inbox-tabs-per-project
title: "Inbox entries grouped into one tab per project"
status: archived
roadmap_item: null
branch: claude/project-thread-xsbv1q
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
The inbox groups its entries into tabs: one "All" tab and one tab per project with entries, each with an icon and a
counter, as on the project page. A project tab is labelled with a short code (the initials of the repository name's
words, `ORDER_TRACKER` → `OT`), or the repository name when it is one word or the code would repeat; never with the
owner prefix. Inside a project tab the rows drop the repeated project name.

## Context
The owner asked for it in the thread with a screenshot of the inbox: 26 entries from several projects in one long
list, each row repeating `owner/NAME`.

## Constraints
- Reuse the theme's `TabBar` exactly as the project page does (CT-5): link tabs (`?project=`), icons, counters,
  touch size on a phone.
- The deferred group ("Later") of PR #62 keeps its behaviour, filtered by the shown tab.
- Copy through `messages/en.ts` and `messages/pl.ts`. No change to loading, the scan or the answer flow.

## Notes
- research skipped: a presentation change to one page reusing a pattern from the previous change (CT-5); the page,
  the row and the tab code were read in full while planning (see research.md for the short notes).
- frame skipped: the owner named the problem and the expected look.

## Done
- Merged as one pull request; rides the next release (the owner's word).
