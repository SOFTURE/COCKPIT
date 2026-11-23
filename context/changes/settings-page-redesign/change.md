---
change_id: settings-page-redesign
title: "Settings reads as grouped cards in the SOFTURE style"
status: planned
roadmap_item: null
branch: claude/project-thread-vcnl0n
created: 2026-11-23
updated: 2026-11-23
---

## Intent
The Settings screen reads at a glance: a constrained column of section cards (watched repositories, team, account),
each with a title and one line of explanation, and every action drawn as the same kind of button in the same place.

## Context
The owner reported the screen as unreadable: the repository field spans the whole window, headings of three sizes
compete, the scan status and team entries are underlined links while the account actions are bordered buttons, and
"Log out" sits lower than the buttons next to it. The cause of the last one: `LogoutButton` of `@softure-ai/auth`
draws `@softure-ai/ui`'s 40 px button, while the theme-notion buttons next to it are 28 px on a desktop.

## Constraints
- Keep every function: add, list and remove watched repositories, scan status, team (admins only), change password,
  assistant access, log out.
- theme-notion components only (`Card`, `Button`, `Field`), design tokens, copy in `messages/en.ts`.
- The sidebar is out of scope (a parallel change fixes its "Log out").
- No release, tag, publish or deploy.

## Notes
- Research skipped: the touch points are one page (`app/(app)/settings/page.tsx`), the add form, the list and the
  message dictionary, all read in full while opening the change.
- Frame skipped: the owner reported a visual problem on one screen; the outcome is not in doubt.
- The repository picker the owner asked for in the same conversation is a separate change.
