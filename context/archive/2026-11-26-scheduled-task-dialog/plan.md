# Plan: scheduled-task-dialog

## Approach
Move the Broadcast form's grouped picker into a controlled shared `ProjectPicker` (`src/shell/project-picker.tsx`) with
its pure rules beside it (`src/shell/project-picks.ts`, moved from `src/broadcast/`), and make Broadcast use it with no
visible change. Build the scheduled task dialog on it: a pure form-state module (defaults, quick times, the time-zone
hint, counters, which field an error names), one client `ScheduledTaskDialog` (theme `Dialog`, server-action form) used
by the header's "New task" button and by the row menu's new Edit item. The actions answer which field failed.

## Key decisions
- D1: `ProjectPicker` is controlled (`picked`, `onPickedChange`), keeps `name="project"` checkboxes, takes its copy as a
  `ProjectPickerCopy` object (Broadcast passes its own keys, so its text is unchanged) and a `layout` of `"page"`
  (Broadcast's columns, unchanged) or `"dialog"` (one column, two from `sm`, in a bordered box that scrolls after
  320 px, `max-h-80`).
- D2: `src/scheduled/scheduled-task-form-state.ts`: `getDefaultRunAt` (tomorrow 08:00 in the app's zone),
  `getQuickTimes` (tomorrow 08:00; the next Monday after today 08:00), `splitRunAt` (an instant to local date and
  time for Edit), `getRunHint` ("Europe/Warsaw · in 3 days"; the zone alone while the date or time is incomplete),
  `getCounter` (title shown from 80 % of its limit, prompt always), `getErrorField` (error code to `title`, `prompt`,
  `when`, `projects` or none).
- D3: `ScheduledTaskActionState.failed` gains `field` (`ScheduledTaskField | null`); the actions fill it with
  `getErrorField`. The form shows the message under that field (`data-invalid`, `aria-invalid`, `aria-describedby`)
  or under the fields when it names none.
- D4: the form keeps its values in state, so a refused save keeps them; the form mounts only while the dialog is open,
  so every opening starts fresh (New: defaults and a new `crypto.randomUUID()` id taken in the click handler; Edit: the
  task's values). The form submits with `noValidate`, so the server's per-field messages are the ones shown.
- D5: `DialogContent size="wide"` plus scroll inside (`max-h-[calc(100dvh-2rem)] overflow-y-auto`, the theme's own
  `sm` size string) and a sticky footer on a phone; the missing form size goes to SOFTURE/AI, not a local wrapper.
- D6: Edit is the first menu item (`opensDialog: true`), focus returns to the menu button on close (CT-30's pattern).
  `ScheduledRow` gains `prompt` and `repositoryKeys`; the page passes the row the edit values and the picker's sections.
- D7: messages: a new `scheduledDialog` block (en, pl); `scheduledPage` gains `newTask` and `edit`.

## Phase 1: Shared picker and form state (TDD)
Move `project-picks.ts` and its test to `src/shell` / `tests/shell`; `ProjectPicker` with its markup test (the CT-34
behaviour, from the shared file); Broadcast uses it, its markup test unchanged and green. Form-state tests: defaults,
chips, hint, counters, error fields. Menu test: Edit first.

## Phase 2: Dialog, actions, page, messages
`scheduled-task-dialog.tsx`, the actions' `field`, the header button, the Edit item, row data, messages; gates.

## Phase 3: e2e and evidence
`e2e/scheduled-dialog.spec.ts` at 1280 and 390 px (its own fixture projects, serial): create with two projects for
tomorrow 08:00 and see the row; past time and empty prompt show their errors and keep the values; Edit changes the time
and the row follows; Cancel and Escape close without saving. `e2e/scheduled.spec.ts` updates its menu items (Edit, Run
now, Delete); Broadcast specs unchanged and green. Screenshots: empty, filled, errors, edit at 1280 and 390, light and
dark, looked at and fixed. Build + full e2e.

## Merge
PR to master, all CI jobs green, coordinator's go, merge, master CI green on the merge commit.

## Progress

### Phase 1: Shared picker and form state

#### Automated
- [x] 1.1 `ProjectPicker` and `project-picks` from `src/shell`, Broadcast markup test unchanged and green — 5afe2da (`tests/shell/project-picker-markup.test.tsx` 5/5, `tests/shell/project-picks.test.ts`, `tests/broadcast/broadcast-form-markup.test.tsx` unchanged, green)
- [x] 1.2 Form state: defaults, quick times, hint, counters, error fields — 5afe2da (`tests/scheduled/scheduled-task-form-state.test.ts` 11/11)
- [x] 1.3 Menu: Edit first, then Run now, then Delete — 5afe2da (`tests/scheduled/scheduled-row-menu.test.tsx` 3/3)

### Phase 2: Dialog, actions, page, messages

#### Automated
- [x] 2.1 Actions answer the failing field; gates green (typecheck, lint, test) — 5afe2da (unit 947/947)

### Phase 3: e2e and evidence

#### Automated
- [x] 3.1 Dialog e2e green at 1280 and 390 px (appended to `e2e/scheduled.spec.ts`, which owns the task rows and runs serially, instead of a new spec); `broadcast.spec.ts`, `grouped-broadcast-picker.spec.ts` green — 5afe2da (scheduled 7/7)
- [x] 3.2 Screenshots of the empty, filled, errors and edit dialog, light and dark, inspected — 5afe2da (/mnt/project-files/cockpit/evidence/scheduled-task-dialog/ 01-new-empty, 02-new-filled, 03-errors, 04-edit; 1280 and 390. Fixed on the way: the time field clipped "08:00 AM" (7 rem → 8 rem); with 67 watched projects the checkboxes' hidden inputs stretched the dialog's scroll below its footer (box made `relative`, e2e checks the footer ends the scroll))
- [x] 3.3 Build and full e2e green — 5afe2da (`npm run build && npm run e2e`: 119 passed)
