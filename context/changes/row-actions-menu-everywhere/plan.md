# Plan: row-actions-menu-everywhere

## Approach
Move the Broadcast detail's project row into its own server component, `src/broadcast/send-row.tsx`, which decides
its controls with a pure function, `pickSendControls` (`src/broadcast/send-controls.ts`): the controls present (Issue,
Retry fire, Retry send), the one shown inline (Retry send if present, else Issue, else Retry fire) and the rest for
the menu. The inline control renders as today (link or form, works without script). The menu is a small client
component, `src/broadcast/send-row-menu.tsx`, built on CT-22's `RowActionsMenu`: Issue opens the issue in a new tab,
Retry fire and Retry send call the same server actions with the same fields. `RetryWakeForm`'s hidden fields come from
one helper in `wake-chip.tsx`, which the menu reuses.

## Key decisions
- One rule in one pure function, unit tested for every combination (0, 1, 2 and 3 controls).
- Menu labels say what each item does ("Open issue #1", "Retry the fire", "Retry the send"), since two "Retry" items
  would read the same; the menu button is "More actions for <project>". English and Polish dictionaries.
- Items are disabled while their action runs (`aria-busy` on the row's controls), as the routine row's Test.
- No change to `src/shell/row-actions-menu.tsx` or the server actions.

## Phase 1: Broadcast project row with one inline control and the row menu
- Files: `src/broadcast/send-controls.ts` (new), `src/broadcast/send-row.tsx` (new), `src/broadcast/send-row-menu.tsx`
  (new), `src/routines/wake-chip.tsx` (`getRetryWakeFields`), `app/(app)/broadcast/[id]/page.tsx`, `messages/en.ts`,
  `messages/pl.ts`, `tests/broadcast/send-controls.test.ts` (new), `tests/broadcast/send-row-markup.test.tsx` (new),
  `e2e/broadcast.spec.ts`, `e2e/routines.spec.ts`, `CHANGELOG.md`.
- Mode: TDD for `pickSendControls`; test-after for the markup; e2e rewritten against the new row.
- Done when: unit tests pin the rule and the markup (two or more controls: one inline control plus the menu button on
  the actions line; one control: inline, no menu); the broadcast e2e at 1280 and 390 px opens the issue from the
  inline link (new tab), opens the menu by pointer and keyboard, runs Retry the fire from it (after a routine is added,
  the fire turns `sent` and the fake routines API received it), runs Retry send inline on the failed row, and checks by
  boxes that state is on line 1 and the inline control and menu button share line 2 in the right column, controls at
  least 44 px on the phone, no sideways scroll; the routines e2e retries through the menu; screenshots 1280/390
  light/dark before and after, looked at and stored; gates and the full e2e green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Broadcast project row with one inline control and the row menu

#### Automated
- [ ] 1.1 `pickSendControls` with unit tests for every combination
- [ ] 1.2 `send-row.tsx` + `send-row-menu.tsx`, page uses them, `getRetryWakeFields` in `wake-chip.tsx`; markup unit tests
- [ ] 1.3 e2e: broadcast detail menu (pointer, keyboard), Retry the fire from the menu, Issue and Retry send inline, layout boxes at 1280 and 390 px; routines e2e through the menu
- [ ] 1.4 Screenshots 1280/390 light/dark before and after, looked at, stored
- [ ] 1.5 Gates green: typecheck, lint (language scan), test, build, full e2e
