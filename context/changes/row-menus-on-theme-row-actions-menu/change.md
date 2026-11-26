---
change_id: row-menus-on-theme-row-actions-menu
title: "Every row menu on the theme's RowActionsMenu"
status: impl_reviewed
roadmap_item: CT-27
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The routine row's menu (Test, Replace token, Delete) and the Broadcast project row's menu (Open issue, Retry the fire, Retry the send) are theme-notion's `RowActionsMenu` in `ListEntry`'s `menu` slot; Delete is its `destructiveAction` with `confirm` (the routine's question, hint, Delete and Cancel words; the dialog stays open and disabled while the delete runs, as today); the local `RowActionsMenu`, `useRowMenuFocus` and, if nothing else uses it, `ConfirmDeleteDialog` are deleted.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-27: Every row menu on the theme's RowActionsMenu
- **Change ID:** `row-menus-on-theme-row-actions-menu`
- **Status:** blocked (SOFTURE/AI#1492)
- **Outcome:** the routine row's menu (Test, Replace token, Delete) and the Broadcast project row's menu (Open issue,
  Retry the fire, Retry the send) are theme-notion's `RowActionsMenu` in `ListEntry`'s `menu` slot; Delete is its
  `destructiveAction` with `confirm` (the routine's question, hint, Delete and Cancel words; the dialog stays open and
  disabled while the delete runs, as today); the local `RowActionsMenu`, `useRowMenuFocus` and, if nothing else uses
  it, `ConfirmDeleteDialog` are deleted.
- **Prerequisites:** CT-26; a theme-notion release that closes SOFTURE/AI#1492 (async confirm, focus to an app
  dialog, touch-size items, item hooks). The item's first phase bumps `@softure-ai/theme-notion` to that release when
  the nightly bump has not yet done so.
- **Touches (estimate):** `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`,
  `src/shell/row-actions-menu.tsx` (deleted), `src/shell/confirm-delete-button.tsx`, `package.json` and
  `package-lock.json` (the bump), `tests/shell/row-actions-menu.test.tsx` (deleted or moved to the callers),
  `e2e/routines.spec.ts`, `e2e/broadcast.spec.ts`, `e2e/expect-routine-row.ts`, `e2e/expect-send-row.ts`.
- **Size:** S
- **Unknowns:**
  - The final API of the fix (names of the pending label, the focus hook and the item id): read from the theme's
    CHANGELOG at the bumped version. (owner: research; blocks: no)
- **Risk:** the menu's focus order with the Replace token dialog (CT-22's unknown) regresses; the e2e checks focus
  returns to the "More actions" button after each dialog closes.
- **Baseline:** today two callers use the local menu; after: no file imports `src/shell/row-actions-menu.tsx` (it is
  gone) and the routines and broadcast e2e pass.
- **Layout:** unchanged from CT-22/CT-23: one inline control, then the "More actions" icon button on the same line;
  the menu lists the regular actions, a separator, then Delete in the danger tone; menu items 44 px on a phone.
- **Verification:** unit tests per caller (the items in order, Delete last and destructive, a disabled item while its
  action runs); e2e on the Routines tab (Test, Replace token with focus back on the menu button, Delete with Cancel
  then confirm, the dialog disabled while deleting) and the Broadcast detail (each menu action), at 1280 and 390 px,
  with 44 px items on a phone. Screenshots of the routine row, its open menu and the delete dialog, and the Broadcast
  row and its open menu, at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the merge;
  master CI green after it.
- **PRD refs:** F-2, F-3
- **Input:** context/changes/row-menus-on-theme-row-actions-menu/change.md

Findings gathered while recording it (theme-notion 0.35.0 from npm, master 8b630c2):
- Owner, 2026-11-26 07:15Z (translated, F-3): "the changes that are done in the Notion package: bump them and carry
  them out still before the deployment, so that the app is switched over to the newest package".
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos": the Layout and
  Verification lines above are binding.
- Package: `RowActionsMenu` (0.35.0): `actions` (`label`, `icon` node, `onSelect`, `isDisabled`), one
  `destructiveAction` with optional `confirm` (`title`, `description`, `confirmLabel`, `cancelLabel`), `label`, `align`.
- Gaps filed as SOFTURE/AI#1492: the confirm dialog closes at once (no pending state for an async delete); an item
  that opens the app's own dialog has no way to keep focus off the trigger or reach the trigger's ref; items are 28 px
  on a phone; items carry no `data-row-action` hook.
- Local copy: `src/shell/row-actions-menu.tsx` (`RowAction` with `id`, `opensDialog`, several destructive items,
  `useRowMenuFocus`, non-modal menu, touch-size content); callers `RoutineRowControls` (Test, Replace token opens
  `ReplaceTokenDialog`, Delete opens `ConfirmDeleteDialog`) and `SendRowMenu` (Open issue in a new tab, Retry fire,
  Retry send with `useTransition`).

## Constraints
- Owns exclusively: `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`, `src/shell/row-actions-menu.tsx`, `src/shell/confirm-delete-button.tsx`, the routines and broadcast row tests and e2e. Shares only `package.json`/`package-lock.json` with CT-28 (whichever merges second re-merges master).
- Starts only once CT-26 is merged and a theme-notion release closing SOFTURE/AI#1492 is on npm.
- Build on `@softure-ai/theme-notion` (AGENTS.md "SOFTURE packages first"): use the package component as it is; a
  missing piece becomes an issue in SOFTURE/AI, never a local wrapper or override.
- The roadmap's binding layout rule for CT-25..CT-28 (section "Slices"): no screen ends up less tidy than its CT-24
  screenshot.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts`.
- On a phone the right column wraps under the identity; controls at least 44 px.
- Each row's own `data-*` attributes stay, so the e2e specs keep finding rows.
- No migration. No release, tag, publish or deploy (the owner's word; F-3: the deploy waits for CT-25..CT-28).
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- `frame` skipped: the roadmap item fixes the solution (the theme component); nothing to reframe.
