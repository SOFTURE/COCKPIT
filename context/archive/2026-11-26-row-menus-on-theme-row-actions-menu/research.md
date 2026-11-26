# Research: row-menus-on-theme-row-actions-menu

Base: CT-26's branch (`fcacb68`, rows on `ListEntry`, menus in its `menu` slot), theme-notion bumped to 0.37.0.

## Today
- `src/shell/row-actions-menu.tsx`: local `RowActionsMenu` (`RowAction` with `id`, `icon` component, `isDestructive`,
  `opensDialog`), `orderRowActions`, `returnFocusTo`, `useRowMenuFocus`; non-modal; its trigger is `size-touch-target`
  with `data-row-actions-menu` and a `title`.
- Callers: `RoutineRowMenu` (`src/routines/routine-forms.tsx`: Test, Replace token opening `ReplaceTokenDialog`, Delete
  opening `ConfirmDeleteDialog`) and `SendRowMenu` (`src/broadcast/send-row-menu.tsx`: Open issue, Retry the fire,
  Retry the send). Both wrap the menu in an element carrying `aria-busy` (`data-routine-controls`, `data-send-menu`).
- `ConfirmDeleteDialog` is also used by `ConfirmDeleteButton` (watched repositories, team, broadcast delete), so the
  file stays; only the routine stops using the dialog without a trigger.
- Tests: `tests/shell/row-actions-menu.test.tsx`, `tests/broadcast/send-row-markup.test.tsx`,
  `tests/routines/routine-row-markup.test.tsx`; e2e `routines.spec.ts`, `broadcast.spec.ts`, `expect-routine-row.ts`,
  `expect-send-row.ts` find the button by `[data-row-actions-menu]` and wait on the wrappers' `aria-busy`.

## theme-notion 0.37.0 `RowActionsMenu` (from the package source and CHANGELOG 0.36.0)
- `actions: RowMenuAction[]` (`id` → `data-row-action`, `label`, `icon` node, `onSelect`, `isDisabled`,
  `opensDialog`), `destructiveAction` (`onSelect` may return a promise; `confirm` with `title`, `description`,
  `confirmLabel`, `pendingLabel`, `cancelLabel`), `label`, `align`, `triggerRef`, `className`.
- The confirm dialog stays open while the promise is pending, both buttons disabled, `pendingLabel` shown; closes on
  resolve, stays open on reject; focus returns to the trigger.
- Trigger: `data-slot="row-actions-menu-trigger"`, `size="icon"` (28 px); the 44 px on a phone comes from `ListEntry`'s
  `list-entry-menu` slot (`max-md:*:min-h-touch-target max-md:*:min-w-touch-target`), which only reaches a **direct
  child**: a wrapper element around the menu would leave the trigger at 28 px.
- Items `max-md:min-h-touch-target`. The confirm dialog's Cancel and Delete buttons are the default 28 px on a phone
  (today's app dialog: 44 px). Filed SOFTURE/AI#1502; used as it is meanwhile (no local override), the fix arrives
  with a bump.

## Answers
- The menu goes straight into `menu` with no wrapper; the routine's sr-only Test result and its Replace token dialog
  sit beside it as siblings (the dialog renders nothing inline; the result is `sr-only`, out of the flow).
- `aria-busy` wrappers go: a running action's item is disabled (theme `isDisabled`), which says the same. e2e waits on
  the result instead (the Test status text, the server action's response).
- The routine's delete: `destructiveAction.onSelect` returns `actions.remove(formData)` (a server action promise).
- e2e can hold a server action open with `page.route` on the POST carrying a `next-action` header, to see the pending
  dialog.
