---
change_id: deletes-confirm-in-dialog-everywhere
title: "Every delete, remove and revoke asks in one confirmation dialog"
status: archived
roadmap_item: CT-16
branch: claude/project-thread-2wlhd5
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
Every destructive control in COCKPIT goes through the shared delete-with-confirmation button CT-14 builds
(`src/shell/confirm-delete-button.tsx`, the Notion design `AlertDialog`), with its trash icon inside the row's box on
the right, not only the broadcast history the owner pointed at.

## Context
The owner (2026-11-25 13:27 Warsaw, translated): "every fix we make now is a standard: we have components, they must
be used across the whole app, not only in the places I listed". Audit of master (8cf56ef) for destructive controls:
- Settings, watched repositories: "Remove" removes at once (`src/projects/watched-repository-list.tsx`, a plain
  submit button with text only).
- Settings → Team, members: removal is an inline `<details>` confirm under the row (`src/team/member-list.tsx`,
  covered by `e2e/team.spec.ts`).
- Routines: "Delete" removes at once (`src/routines/routines-section.tsx`); CT-12 moves it to the dialog, not here.
- Broadcast history: CT-14 itself.
- Account → assistant tokens "Revoke" (`TokenManager`, `@softure-ai/mcp-access`) and Team → invitations "Revoke"
  (`InvitationPanel`, `@softure-ai/auth`) revoke at once; they are package components, filed as SOFTURE/AI#1469 and
  SOFTURE/AI#1470, and picked up here only by a version bump when those ship.

## Constraints
- Reuse CT-14's `ConfirmDeleteButton`; no second confirm component. If it needs one more prop (a destructive word
  other than "Delete", such as "Remove"), add it there.
- The dialog names what goes and what stays (a removed repository keeps its cockpit issues; a removed member's
  account ends).
- Copy in both message dictionaries; 44 px controls on a phone.
- No release, tag, publish or deploy.

## Notes
- Research may be short: the two surfaces are listed above with their files.
- Frame skipped: the owner's standing rule; the outcome is not in doubt.

## Done
- **CT-16** `deletes-confirm-in-dialog-everywhere`: removing a watched repository on Settings and a member on Settings → Team goes through the shared `ConfirmDeleteButton`, its trash can on the right of the row; the dialog names what goes and what stays, and cancel keeps the row; package-owned Revoke buttons follow by a bump (SOFTURE/AI#1469, #1470); waiting: release; archived in `archive/2026-11-25-deletes-confirm-in-dialog-everywhere/`
