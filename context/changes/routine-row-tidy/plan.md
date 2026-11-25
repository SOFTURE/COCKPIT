# Plan: routine-row-tidy

## Approach
Build the shared `RowActionsMenu` (`src/shell/row-actions-menu.tsx`) on the theme's `DropdownMenu`: a 44 px ghost
icon button "More actions" that opens a menu of items, destructive items last after a separator. Split the
confirmation dialog out of `ConfirmDeleteButton` so a menu item can open it. Rebuild the routine row: line 1 of the
right column is the last-call badge alone (always present: "HTTP 200 · 21:04", "Error · 21:04" or a grey "Never
called"); line 2 is the switch with its label and the menu (Test, Replace token, Delete). The state icon and the
"last call" detail go. `ListRow`'s doc comment states the two rules.

## Key decisions
- Items are data (`RowAction`: id, label, icon, onSelect, isDisabled, isDestructive), not children, so the component
  enforces the order rule itself (`orderRowActions`, unit tested) and CT-23 reuses it as is.
- Dialogs stay outside the menu, controlled; the menu is `modal={false}`; dialogs return focus to the menu trigger
  through `onCloseAutoFocus` (a `triggerRef` the caller passes to the menu).
- Test keeps today's result handling: hidden `role="status"` announcement, the badge shows the result. No toast.
- The badge carries the time, so the fact "last call" is said once.
- Keyboard behaviour is verified in the e2e (real browser), the order rule and markup in unit tests (no DOM library in
  the project; adding one is a dependency change this item does not need).

## Phase 1: Shared row menu and the tidy routine row

- Files: `src/shell/row-actions-menu.tsx` (new), `src/shell/list-row.tsx` (doc comment),
  `src/shell/confirm-delete-button.tsx` (`ConfirmDeleteDialog` split out), `src/routines/routine-forms.tsx`
  (controlled `ReplaceTokenDialog`, `RoutineRowControls` replacing `TestRoutineForm`), `src/routines/routines-section.tsx`,
  `messages/en.ts`, `messages/pl.ts`, `tests/shell/row-actions-menu.test.tsx` (new),
  `tests/routines/routine-row-markup.test.tsx` (new), `e2e/routines.spec.ts`, `e2e/capture-evidence.ts` (new),
  `CHANGELOG.md`.
- Mode: test-after for markup (the row's shape is new), with the e2e rewritten first against the new layout.
- Done when: unit tests pin the order rule, the trigger and the row (one badge, no state icon, no last-call detail,
  switch and menu trigger in one actions line); the e2e at 1280 and 390 px adds a routine, switches it off and on,
  opens the menu with the keyboard (Enter, arrows, Escape), Tests from the menu and sees the badge change, Replaces the
  token, Deletes with cancel and confirm, and asserts by bounding boxes the badge on line 1 and the switch and menu on
  one line 2 in the right column; screenshots 1280/390 light/dark before and after looked at and stored; gates green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Shared row menu and the tidy routine row

#### Automated
- [ ] 1.1 `RowActionsMenu` with `orderRowActions`, unit tests (order, trigger markup)
- [ ] 1.2 `ConfirmDeleteDialog` split out; other callers unchanged
- [ ] 1.3 Routine row: one badge with time, switch + menu on line 2, no state icon, no last-call detail; unit tests
- [ ] 1.4 e2e: menu by keyboard, Test, Replace token, Delete (cancel, confirm), layout boxes at 1280 and 390 px
- [ ] 1.5 Screenshots 1280/390 light/dark before and after, looked at, stored
- [ ] 1.6 Gates green: typecheck, lint, test, e2e, doctor
