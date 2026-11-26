# Research: row-state-and-controls-on-one-line

## Today
- theme-notion 0.37.0 `ListEntry` (`src/notion/List.tsx`): `list-entry-side` holds `list-entry-column`
  (`flex flex-col items-end gap-1`) with `list-entry-status` on top and `list-entry-actions` (inline control, then
  `list-entry-menu`) under it. A control marked `data-row-wide` turns the column full width (`items-stretch`).
- `FoldRow` (`src/notion/FoldRow.tsx`): `fold-row-actions` is `flex flex-wrap items-center gap-2` below `md` (already one
  line) and `md:flex-col md:items-end` from `md`, `fold-row-status` on top, `fold-row-action-list` under it.
- 0.37.1 (latest) changes only `RowActionsMenu`; no option for a one-line column. Filed as SOFTURE/AI#1508.
- Theme classes are Tailwind utilities in the `utilities` layer (`app/globals.css`); an unlayered rule in the app's
  stylesheet wins over them.

## Rows with a state and controls
Settings repositories (`watched-repository-list.tsx`: badge + trash can), Team (`member-list.tsx`), routines
(`routines-section.tsx`: last-call badge + switch + menu), fired issues (`fired-issue-row.tsx`), inbox and project
Waiting (`inbox-row.tsx`: answer state + Retry / answer buttons; the confirming form is `data-row-wide`), Broadcast
project rows (`send-row.tsx`: state + one button + menu), roadmap items (`roadmap-view.tsx` `FoldRow`: pill + promote).

## Tests that pin the old layout
- `e2e/expect-row-state.ts`: `actionsBox.y >= statusBox.y + statusBox.height`, and the status ends at the column's
  right edge.
- `e2e/expect-fold-row-column.ts`: at 1280 the action sits under the status, right edges aligned.
- `e2e/expect-routine-row.ts`, `e2e/expect-send-row.ts`, `e2e/expect-side-holds-state-and-controls.ts`: to be checked
  in the run; the full e2e names any other.
