---
change_id: scheduled-task-dialog
title: "Create and edit a scheduled task in a dialog"
status: planned
roadmap_item: CT-38
created: 2026-11-26
updated: 2026-11-26
---

## Intent
"New task" on the Scheduled tasks page and "Edit" in a scheduled row's menu open one dialog with the title, the prompt, the date and time, and the project picker; saving closes the dialog and the row appears (or changes) in the Scheduled tab. The project picker is the Broadcast form's grouped picker, moved into the shared `ProjectPicker` and used by both forms.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-38: Create and edit a scheduled task in a dialog
- **Change ID:** `scheduled-task-dialog`
- **Status:** ready
- **Outcome:** "New task" on the Scheduled tasks page and "Edit" in a scheduled row's menu open one dialog with
  the title, the prompt, the date and time, and the project picker; saving closes the dialog and the row appears (or
  changes) in the Scheduled tab. The project picker is the Broadcast form's grouped picker, moved into the shared
  `ProjectPicker` and used by both forms.
- **Prerequisites:** CT-37, CT-34 (the grouped picker it reuses).
- **Touches (estimate):** `src/shell/project-picker.tsx` (new, extracted from `src/broadcast/broadcast-form.tsx`),
  `src/broadcast/broadcast-form.tsx` (uses it; no visible change), `src/scheduled/scheduled-task-dialog.tsx` (new),
  `src/scheduled/scheduled-task-form-state.ts` (new), `app/(app)/scheduled/page.tsx` (the header button and the
  Edit item), `messages/en.ts`, `messages/pl.ts` (own block), `tests/scheduled/**`, `tests/broadcast/**`,
  `e2e/scheduled.spec.ts`, `e2e/broadcast.spec.ts` (stays green).
- **Size:** M
- **Rules:** the dialog is the theme's `Dialog` with a server-action form (as the project group dialog of CT-30); the
  form keeps its values on a refused save and shows each error under its field; the date and time are the theme's
  `Input` with `type="date"` and `type="time"` (native pickers on a phone) until theme-notion ships a picker
  (SOFTURE/AI#1509), then the package component replaces them; the time zone is shown, never asked.
- **Unknowns:** none.
- **Risk:** extracting the picker touches the Broadcast form; its e2e and unit tests must pass unchanged.
- **Baseline:** after CT-37 tasks exist only as fixtures; after: the owner creates and edits them.
- **Layout:** the dialog, 640 px wide from `md`, full width with 16 px margins on a phone, scrolls inside on a short
  screen. Header: "New task" or "Edit task", one muted line ("At the chosen time every chosen project gets an
  issue with this prompt."). Fields top to bottom, 16 px apart, each the theme's `Field` with its label above: "Title"
  (one-line input, counter under it near the limit); "Prompt" (textarea, 8 rows, grows to 16, monospace off, counter);
  "When": the date and the time side by side (time 7 rem wide) on one line, then a muted "Europe/Warsaw · in 3 days"
  computed as you type, and two quick chips under it, "Tomorrow 08:00" and "Monday 08:00", that fill the fields;
  "Projects": the shared `ProjectPicker` (groups with their checkbox, Select all / Clear all, "Selected: N of M"), inside
  a bordered box that scrolls after 320 px. Footer, right-aligned: "Cancel" (secondary) and "Schedule" or "Save"
  (primary, a spinner while saving). On a phone the footer sticks to the dialog's bottom, buttons 44 px, full width,
  primary first.
- **Verification:** unit tests: the form state (defaults: tomorrow 08:00, nothing selected; chips; the relative-time
  hint; errors per field from the action's result); `ProjectPicker` (the CT-34 behaviour, now from the shared file).
  e2e at 1280 and 390 px: create a task with two projects for tomorrow 08:00 and see it in the Scheduled tab; a past
  time and an empty prompt show their errors and keep the values; Edit changes the time and the row follows; Cancel
  and Escape close without saving; the Broadcast form still sends. Screenshots of the empty dialog, the filled dialog,
  the dialog with errors and the edit dialog at 1280 and 390 px, light and dark, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the merge;
  master CI green after it.
- **PRD refs:** F-8, F-2
- **Input:** context/changes/scheduled-task-dialog/change.md

Findings gathered while recording it (master b92aa7d):
- Owner, 2026-11-26 10:46Z (F-8, translated): scheduled tasks: set the date when a prompt fires as an issue in the
  chosen repositories (example: a code-quality check across chosen projects on Monday after the token allowance
  resets, run by itself); a separate tab in the left menu, by the app's existing standard (tabs, a dialog).
- `src/projects/project-group-forms.tsx` (CT-30) is the existing dialog-with-server-action pattern.
- theme-notion 0.37.0 has no date picker; SOFTURE/AI#1509 asks for one. Until it ships, the theme's `Input` with `type="date"` and `type="time"`.

## Constraints
- Owns (lane L): `src/shell/project-picker.tsx` (new), `src/broadcast/broadcast-form.tsx`, `src/scheduled/scheduled-task-dialog.tsx`, `src/scheduled/scheduled-task-form-state.ts`.
- Starts once CT-37 and CT-34 are merged.
- The roadmap's binding layout rule for CT-37..CT-39 (section "Slices").
- Build on the `@softure-ai/*` packages (AGENTS.md "SOFTURE packages first"); a missing piece becomes an issue in
  SOFTURE/AI right away, never a local wrapper or override.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts` (each item adds its own block); on a phone controls are at least 44 px.
- COCKPIT's only write to watched repositories stays the cockpit issue (AGENTS.md "Access to watched repositories").
- Fixtures, screenshots and test data are fictional (AGENTS.md "Open source and generic").
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- Frame skipped: the owner's explicit feature, with the split recorded in the roadmap.
