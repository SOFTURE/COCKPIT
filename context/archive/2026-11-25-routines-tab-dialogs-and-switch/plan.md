# Plan: routines-tab-dialogs-and-switch

## Approach
Shared pieces first, then the tab. A new `FieldHelp` (`src/shell/field-help.tsx`) shows a hint as a "?" tooltip
(hover, focus or tap) and keeps the text in the page for `aria-describedby`. The kinds move to `modules/projects/routine-kinds.ts` (no server
imports) with `ROUTINE_KINDS`; the server accepts only listed kinds. The add form and the replace-token form become
dialogs (theme `Dialog`), closed once saved; the kind is a `Select` naming the kind in words; the "Enabled"
checkbox goes, a new routine starts enabled. Each row: state icon (green/orange `Status`) by the name, the kind badge
in words, the last call as a green or red badge; on the right a `Switch`, Test (result announced, not shown), Replace
token (dialog) and Delete (`ConfirmDeleteButton`).

## Key decisions
- `FieldHelp` is a shared shell component; only the Routines tab uses them in this change
  (app-wide rollout is planned as its own roadmap items).
- Test's result is an `sr-only` live region; the row's last-call badge shows the outcome after the refresh.
- `enabled` is forced to `true` in `addRoutineAction`; the switch posts through the existing `setRoutineEnabledAction`.

## Phase 1: Kinds list on the server (TDD)
- `modules/projects/routine-kinds.ts` (new), `modules/projects/routines.ts`, `src/routines/manage-routines.ts`,
  `tests/routines/manage-routines.test.ts`.
- Done when: a unit test refuses `reports` and `Cockpit Issues` with `routines.kind_invalid` and accepts the default.

## Phase 2: Dialogs, switch, marks and the "?" hints (test-after)
- `src/shell/field-help.tsx` (new), `src/routines/routine-forms.tsx`,
  `src/routines/routines-section.tsx`, `app/(app)/routines/actions.ts`, `messages/{en,pl}.ts`,
  `e2e/routines.spec.ts`, `CHANGELOG.md`.
- Done when: the e2e adds a routine through the header's dialog and sees its switch on, opens a field's "?" tooltip,
  replaces the token in a dialog, switches it off and on, and deletes a routine through the confirmation dialog;
  screenshots at 1280 and 390, light and dark, are looked at; gates green.

## Progress

### Phase 1: Kinds list on the server
- [x] 1.1 `ROUTINE_KINDS` and the server check, unit test first (failed first on `reports`, then 6/6 passed) — 8903e26

### Phase 2: Dialogs, switch, marks and the "?" hints
- [x] 2.1 `FieldHelp` (shared "?" tooltip by a field's label) — 8903e26
- [x] 2.2 Add-routine and replace-token dialogs, kind list, no Enabled checkbox — 8903e26
- [x] 2.3 Row: state icon, kind in words, last-call badge, controls on the right (switch, Test, Replace token, Delete via `ConfirmDeleteButton`) — 8903e26, 1a4bf1f
- [x] 2.4 e2e through the dialogs, the "?" tooltip, the switch and the delete confirmation (`e2e/routines.spec.ts` 1/1 passed) — 8903e26
- [x] 2.5 Evidence screenshots looked at (Routines card, add dialog with a tooltip, replace-token dialog, delete confirmation; 1280/390, light/dark): `cockpit/evidence/routines-tab-dialogs-and-switch/0N-<what>-after-<width>-<theme>.webp` — 8903e26
- [x] 2.6 Gates green: typecheck, lint (language scan), test (vitest 683/683), routines e2e; full suite in CI — 1a4bf1f
