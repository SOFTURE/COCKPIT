# Plan: row-menus-on-theme-row-actions-menu

## Approach
Bump `@softure-ai/theme-notion` to 0.37.0 (CT-26 does the same; the lockfile is re-merged with master). Rewrite
`RoutineRowMenu` and `SendRowMenu` on the theme's `RowActionsMenu`: the routine's Test and Replace token are `actions`
(Replace token `opensDialog`, its dialog returns focus through `triggerRef`), Delete is `destructiveAction` with
`confirm` (question, hint, Delete, Deleting…, Cancel) running the server action as a promise. The menu is the direct
child of `ListEntry`'s `menu` slot (no wrapper). Delete `src/shell/row-actions-menu.tsx` and its test; keep
`ConfirmDeleteDialog` for `ConfirmDeleteButton`.

## Key decisions
- No wrapper and no `aria-busy` around the menus: the trigger must be the slot's direct child to get 44 px on a phone;
  disabled items show a running action.
- Unit tests per caller: render the menu opened (Radix `defaultOpen` is not exposed, so the items are pinned through
  the props each caller builds: an exported pure builder per caller, `buildRoutineMenu` / `buildSendMenuActions`).
- The confirm dialog's 28 px buttons on a phone are the theme's (SOFTURE/AI#1502), used as they are.

## Phase 1: Both row menus on the theme's RowActionsMenu
- Files: `package.json`, `package-lock.json`, `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`,
  `src/shell/row-actions-menu.tsx` (deleted), `tests/shell/row-actions-menu.test.tsx` (deleted),
  `tests/routines/routine-row-menu.test.tsx` (new), `tests/broadcast/send-row-menu.test.tsx` (new),
  `tests/broadcast/send-row-markup.test.tsx`, `tests/routines/routine-row-markup.test.tsx`, `e2e/routines.spec.ts`,
  `e2e/broadcast.spec.ts`, `e2e/expect-routine-row.ts`, `e2e/expect-send-row.ts`, `CHANGELOG.md`.
- Mode: test-after (a swap of a component); the builders get unit tests first.
- Done when: unit tests pin each caller's items in order, Delete last and destructive with its confirm copy, a
  disabled item while its action runs; no file imports `src/shell/row-actions-menu.tsx`; routines e2e at 1280 and
  390 px: keyboard order, Test, Replace token with focus back on the menu button, Delete with Cancel (focus back),
  then confirm with the dialog disabled and "Deleting…" while the action is held, 44 px items and button on a phone;
  broadcast e2e: each menu action (Retry the fire by pointer, keyboard and tap; Open issue pinned by unit test);
  screenshots of the routine row, its open menu, the delete dialog, the Broadcast row and its open menu at 1280/390
  light/dark before and after, looked at and stored; gates and the full e2e green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Both row menus on the theme's RowActionsMenu

#### Automated
- [x] 1.1 Bump theme-notion to 0.37.0; builders + unit tests per caller (`tests/routines/routine-row-menu.test.tsx` 5/5, `tests/broadcast/send-row-menu.test.tsx` 4/4; `npm test` 789/789) — 9dd17d7
- [x] 1.2 Both callers on the theme's `RowActionsMenu`; local menu and its test deleted; `ConfirmDeleteDialog` folded into `ConfirmDeleteButton` (no other user); `grep row-actions-menu src` finds nothing — 9dd17d7
- [x] 1.3 e2e routines and broadcast adapted and extended (pending delete dialog held by `page.route`, focus back on the menu button, 44 px button and items at 390 px): `e2e/routines.spec.ts` + `e2e/broadcast.spec.ts` 6/6 — 9dd17d7
- [x] 1.4 Screenshots 1280/390 light/dark before (master 4732342) and after, looked at, stored: `/mnt/project-files/cockpit/evidence/row-menus-on-theme-row-actions-menu/` (01-projects, 02-menu-open, 01-row-new, 02-row-disabled, 03-row-tested, 04-row-menu-open before/after; 05-delete-dialog after only, the before spec had no such shot; 52 files). Seen: one control plus the menu button on line 2, menu items in order with Delete last in red, 44 px items on a phone; the confirm dialog's buttons are the theme's 28 px on a phone (SOFTURE/AI#1502) — 9dd17d7
- [x] 1.5 Gates green: typecheck, lint, test 791/791, build; full e2e 84/85 locally (the one failure, the Settings "?" tooltip, is outside this change: hover opens and the click toggles it shut in `src/shell/field-help.tsx`, handed to the coordinator for its own change); PR #136 CI all jobs green on df0f09f — 9dd17d7

## Decisions (auto)
- Base on CT-26's branch and rebase onto master once CT-26 merges (the coordinator's brief).
- SOFTURE/AI#1502 does not block: the component is used as it is; the bump fixes the app.
