# Research: routine-row-tidy

## Where it lives
- `src/routines/routines-section.tsx` `RoutineRow` builds the row on the shared `ListRow` (`src/shell/list-row.tsx`):
  `status` = a `Status` icon (enabled/disabled) plus `LastCallBadge` (`ResultBadge`, shown only after a call);
  `details` = provider, target, token, and `describeLastCall` ("last call <time>" or "never called");
  `actions` = `RoutineEnabledSwitch`, `TestRoutineForm`, `ReplaceTokenDialog`, `ConfirmDeleteButton`, four loose
  controls in one wrapping line (`LINE_CLASS` is `flex-wrap`).
- `src/routines/routine-forms.tsx`: `ReplaceTokenDialog` owns its `DialogTrigger`; `TestRoutineForm` is a form with a
  submit button and a hidden `role="status"` result (the badge shows the result). Neither is used outside the row.
- `src/shell/confirm-delete-button.tsx`: trash button + `AlertDialog`, used also by watched repositories, team members
  and broadcasts (CT-23/CT-24 lanes); its trigger is built in, so it cannot be opened from a menu item today.
- Messages: `routines.lastCallBadge` "HTTP {status}", `lastCallError`, `lastCallAt`, `neverCalled` (en and pl).

## Theme
- `@softure-ai/theme-notion` 0.31.0 exports `DropdownMenu*` (radix-ui). `DropdownMenuContent` takes `size="touch"`
  (44 px items), `DropdownMenuItem` takes `variant="destructive"`. No row overflow menu (SOFTURE/AI#1486, filed).
- `Button` has `size="icon-touch"` (44 px) and `variant="ghost"`; the app pairs it with `md:size-8`.

## Unknowns answered
- Test from a menu item: the menu's content unmounts when it closes, so the Test action state cannot live in the
  item. It lives in the row's controls component (`useActionState` dispatched in a transition from `onSelect`); its
  hidden `role="status"` result stays in the row, so the result is still announced and the badge refreshes when the
  action revalidates the page. No toast.
- Dialogs from a menu item: the dialogs are rendered outside the menu and controlled (`open` state set in `onSelect`).
  The menu is `modal={false}` so it leaves no `pointer-events: none` on the body when the dialog opens, and each
  dialog's `onCloseAutoFocus` returns focus to the menu's trigger (the item it opened from no longer exists).
- Unit tests: the project's vitest runs in node with `renderToStaticMarkup` (no DOM library); radix menus render
  their content only in a portal on the client. Keyboard behaviour (Enter, arrows, Escape) is pinned in the e2e in a
  real browser; the unit tests pin the item order rule (pure function) and the markup (trigger, row).

## Risks
- `e2e/routines.spec.ts` clicks Test, Replace token and Delete directly and reads "never called" in the row text; it
  must open the menu first. `data-routine`, `data-enabled`, `data-last-call-badge`, `data-routine-switch`,
  `data-token-last4`, `data-routine-provider` stay.
- `ConfirmDeleteButton` keeps its API for its three other callers; the dialog is split out, not changed.

## Reuse
- `ListRow`, `ResultBadge` (tone `muted` for "Never called"), theme `DropdownMenu`, `Button`, `AlertDialog`, `Dialog`.
