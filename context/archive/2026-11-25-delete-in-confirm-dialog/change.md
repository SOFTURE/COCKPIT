---
change_id: delete-in-confirm-dialog
title: "Delete after a confirmation dialog, the trash can inside the row"
status: archived
roadmap_item: CT-14
branch: claude/project-thread-j7aw3f
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
A sent broadcast's trash can sits inside its row's box, after the arrow, and opens a confirmation dialog (the
Notion design `AlertDialog`) instead of an inline confirm. One shared delete-with-confirmation button, reused for
routines by CT-12.

## Context
The owner (2026-11-25 12:58 Warsaw, F-13) sent screenshots of Broadcast's history: the trash can stood outside the
row's hover box and the confirm opened inline, squeezing the row. Evidence:
`cockpit/evidence/delete-in-confirm-dialog/01-history-row-before-3194-dark.webp`, `02-delete-confirm-before-970-dark.webp`.

## Constraints
- The issues a broadcast created stay; the dialog says so.
- 44 px controls on a phone.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual fix the owner asked for with screenshots; the outcome is not in doubt.
- A draft from the feedback session is in the project files, `cockpit/drafts/visual-fixes-draft.patch` (input, not a source of truth).
- Research kept short: one component and one page, with an existing `AlertDialog` pattern in `promote-form.tsx`.

## Done
- **CT-14** `delete-in-confirm-dialog`: a sent broadcast's trash can sits inside its row's box after the arrow and opens a confirmation dialog (the theme's `AlertDialog`) saying its issues stay in the projects; one shared `ConfirmDeleteButton` (`src/shell/confirm-delete-button.tsx`) for CT-12 to reuse; waiting: release; archived in `archive/2026-11-25-delete-in-confirm-dialog/`
