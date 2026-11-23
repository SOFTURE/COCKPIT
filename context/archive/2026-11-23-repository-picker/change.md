---
change_id: repository-picker
title: "Watched repositories are picked from the ones the token can read"
status: archived
roadmap_item: null
branch: claude/project-thread-vcnl0n
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
On Settings, the Repository field searches the repositories COCKPIT's access token can read (organisation and
personal ones alike) and offers the ones not watched yet, so the owner picks a repository instead of typing
`owner/name`. Typing `owner/name` by hand still works.

## Context
The owner asked for a searchable list instead of manual typing. The production token is fine-grained and scoped to
selected repositories, so the list is exactly what that token can read: a repository missing from it has to be
added to the token first, and the screen says so.

## Constraints
- Read only: one more GET (`/user/repos`), no new token scope beyond Metadata: read.
- Adding still goes through the same server action and its access check.
- theme-notion components (`Command`), copy in `messages/en.ts`.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the forge client (`src/forge/client.ts`), the add form and the fake forge were read in full for
  the settings-page-redesign change in the same session.
- Frame skipped: the owner named the outcome; manual entry stays as the fallback.
