# Plan: list-rows-on-theme-list-entry

## Approach
Swap the local `ListRow` for the theme's `ListItem` + `ListEntry` in every caller in one phase, move each row's menu
into `menu`, put every list of these rows on the theme's `List` with `density="roomy"` (the inbox's look, closest to the
local row's 10 px padding and line), rewrite the row tests and e2e helpers on `data-slot="list-entry-*"`, delete
`src/shell/list-row.tsx`, `src/shell/row-inset.ts` and the local row's unit test.

## Key decisions
- A row's own `data-*` go on `ListEntry` (the row), not on the `li`; specs find the row by them as before, and the
  `li` stays the list item that `getByRole("listitem")` finds.
- Lists: `ul.grid.divide-y` becomes `List density="roomy"`, keeping their extra `border-t`/`border-y` and `aria-label`.
- Internal links: `linkComponent={AppLink}`; external rows: `linkComponent={ExternalRowLink}` (new
  `src/shell/external-row-link.tsx`, `target="_blank" rel="noreferrer"`).
- Title aside joins the `title` node (`<span class="flex flex-wrap items-center gap-2">`).
- Routine row: `RoutineRowControls` splits into the exported `RoutineEnabledSwitch` (`actions`) and `RoutineRowMenu`
  (`menu`: the menu, its hidden Test result and its two dialogs; keeps `data-routine-controls` and `aria-busy`).
- Broadcast project row: the inline control in `actions`, `SendRowMenu` in `menu`.
- Empty status lists pass `null` (theme draws an array of nulls).
- `ResultBadge` and `RowActionsMenu` stay local (CT-28, CT-27).

## Phase 1: Every list row on ListEntry
- Files: the 17 callers named in change.md, `src/shell/external-row-link.tsx` (new), `src/shell/list-row.tsx` and
  `src/shell/row-inset.ts` (deleted), `tests/shell/list-row-markup.test.tsx` (deleted), `tests/support/row-markup.ts`,
  the row unit tests, `e2e/expect-*.ts`, `e2e/expect-list-entry-rows.ts` (new) and the specs reading `data-row-*`.
- Contract: no file imports `list-row.tsx`; every `li` of the 14 screens' lists holds exactly one
  `[data-slot=list-entry]`.
- Tests (test-after, the markup is the theme's): unit tests per migrated row on the theme's slots, a new unit test
  `tests/shell/list-entry-rows.test.tsx` that every row component renders `ListEntry`; e2e helper
  `expectListEntryRows` (every `li` of the list holds one `ListEntry`) on all 14 screens; the layout helpers on the
  theme's slots; touch targets (44 px) at 390 px for switch, inline control and menu.
- Done when: gates green (typecheck, lint, test), full e2e green, before/after screenshots of every list screen at
  1280/390 light/dark looked at and stored under `/mnt/project-files/cockpit/evidence/list-rows-on-theme-list-entry/`.

## Decisions (auto)
- One phase: the swap is mechanical per caller and the helpers must move together.
- Roomy density on every list instead of compact: keeps the line between rows and roughly the old height.

## Progress

### Phase 1: Every list row on ListEntry
- [x] 1.1 Evidence captures in the specs; before screenshots on the old code (e2e 81/81 on master ad694f7, 19 lists × 4)
- [x] 1.2 Callers on `ListItem` + `ListEntry`, lists on `List` roomy, menus in `menu`; local row and inset deleted
- [x] 1.3 Unit tests and e2e helpers on the theme's slots; `expectListEntryRows` asserts on all 14 screens (unit 786/786)
- [ ] 1.4 Gates green: typecheck, lint, test, full e2e — blocked (SOFTURE/AI#1497): e2e 10 failed, all on one
  check: `ListEntry` centres the right column against a multi-line identity (state 6–58 px below the title at
  1280 px); waits for the theme release that aligns it to the top
- [ ] 1.5 After screenshots looked at, wraps/overlaps fixed, evidence stored
