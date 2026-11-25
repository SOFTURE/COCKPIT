---
change_id: routines-tab-dialogs-and-switch
title: "The Routines tab in dialogs, with a switch, marks and a kind list"
status: archived
roadmap_item: CT-12
branch: claude/project-thread-lti1jw
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
The Routines card's header has "Add routine", which opens the form in a dialog; field hints are "?" tooltips by the
label; the kind is picked from a list that names it in words and the server accepts only listed kinds; a new
routine starts enabled; each routine row shows a green or orange state icon by its name, its last call as a green
or red badge beside the kind, and on the right an on/off switch, Test, "Replace token" (a dialog) and Delete (the
CT-14 confirmation dialog).

## Context
The owner (2026-11-25 12:52 to 13:00 Warsaw, F-11) sent screenshots of the Routines tab: inline hints, a
free-text kind, an "Enabled" checkbox on the add form, the form always open under the list, "Replace token" as an
inline field, Test widened by its result text, and the controls under the routine instead of on the right.
Evidence: `cockpit/evidence/routines-tab-dialogs-and-switch/01…07-*-before-*-dark.webp`.

## Constraints
- The kind is stored as `cockpit-issues` as today; only its label changes.
- Notion design components (`Dialog`, `Select`, `Switch`, `Tooltip`, `Status`, `Badge`).
- Copy in both message dictionaries.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual fix the owner asked for with screenshots; the outcome is not in doubt.
- A draft from the feedback session is in the project files, `cockpit/drafts/visual-fixes-draft.patch` (input, not a source of truth).

## Done
- **CT-12** `routines-tab-dialogs-and-switch`: the Routines card's header "Add routine" opens the form in a dialog; field hints are "?" tooltips (shared `FieldHelp`, `src/shell/field-help.tsx`); the kind is picked from a list in words and the server accepts only `ROUTINE_KINDS`; a new routine starts enabled; each row shows a green/orange state icon, the kind in words and the last call as a green/red badge, with an on/off switch, Test, "Replace token" (dialog) and Delete (`ConfirmDeleteButton`) on the right; waiting: release; archived in `archive/2026-11-25-routines-tab-dialogs-and-switch/`
