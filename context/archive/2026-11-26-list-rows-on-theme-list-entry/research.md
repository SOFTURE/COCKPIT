# Research: list-rows-on-theme-list-entry

Read on master ad694f7 with `@softure-ai/theme-notion` 0.35.0 installed (`node_modules/@softure-ai/theme-notion/dist/notion/List.js`).

## The theme's ListEntry (0.35.0)
- `ListEntry` renders a `div` `data-slot="list-entry"` (rest props pass through, so a row's own `data-*` stay on it):
  `list-entry-identity` (title + `list-entry-details`), `list-entry-side` > `list-entry-column` >
  (`list-entry-status`, `list-entry-actions` > (actions, `list-entry-menu`)), and `list-entry-arrow` (a `ChevronRight`)
  beside the column whenever `href` is set (also for a link that leaves the app).
- `status`, `actions`, `menu` are single nodes; `isDrawn` treats only `undefined`, `null`, `false` as empty, so an
  array of nulls draws an empty slot. Callers pass `null` when empty (Team's badges, inbox fires).
- The title link is `linkComponent` (default `a`), given `data-slot`, `href`, `className`, `children`. `AppLink` takes
  them (it spreads its props onto `next/link`). An external row needs `target="_blank" rel="noreferrer"`: a small
  `ExternalRowLink` component in `src/shell/` passes them (inside the theme's API, no gap).
- The title is wrapped in `text-ui-medium`; a title aside (Team's email, a routine's kind tag) joins the `title` node
  as a flex line; rows whose title is not medium weight (roadmap item, CI run) keep their inner `font-normal` span.
- `data-row-wide` on a control makes the side take the full width (`has-[[data-row-wide]]`), as the local row did.
- Rows follow the list density: compact (`--list-row-y` 4 px, no line) by default, roomy (8 px + 4 px item, 1 px line)
  with `data-density="roomy"`. The local row had 10 px top and bottom and the lists drew `divide-y`. Only the inbox
  page uses the theme's `List` (roomy) today; the other 13 lists are plain `ul.grid.divide-y`.
- `ListEntry` always lights on hover (`hover:bg-accent`), also a row that opens nothing; the local row lit only link
  rows. That is the theme's documented look; taken as is.
- On a phone the identity takes the full width (`max-md:basis-full`), so the column always wraps under it below 768 px;
  every direct child of the actions line gets the 44 px touch target, and the menu slot too.

## Callers (14 screens, 17 files)
`overview-row.tsx` (link), `inbox-row.tsx` (answer form, `data-row-wide`), `answered-earlier-row.tsx`, `send-row.tsx`
(inline control + `SendRowMenu` → `menu`), broadcast page (link + delete button), `project-page-sections.tsx`
(roadmap item, queued link, change; inbox rows), `history-sections.tsx` (external merge, release, run rows; findings),
`routines-section.tsx` (`RoutineRowControls` holds switch + menu + dialogs → split), `fired-issue-row.tsx` (external),
`watched-repository-list.tsx`, `member-list.tsx` (title aside, status list), `scan-project-row.tsx`,
`packages-details.tsx` (two lists), `deploys-list.tsx` (link). `send-controls.ts` only has a comment naming ListRow.
`src/shell/row-inset.ts` (`ROW_SURFACE_CLASS`) is imported by nothing: deleted.

## Tests reading the local markup
Unit: `tests/shell/list-row-markup.test.tsx` (deleted with the row), `tests/support/row-markup.ts` (`getRowPart`),
inbox, history, scan, packages, send-row and routine-row markup tests. e2e: `expect-row-state.ts`,
`expect-side-holds-state-and-controls.ts`, `expect-routine-row.ts`, `expect-send-row.ts`, and `data-row-*` reads in
`row-facts`, `broadcast`, `overview`, `routines` specs. `data-row-actions-menu`/`data-row-action` belong to the local
`RowActionsMenu` (CT-27) and stay. `status-action-fold-row.tsx` (`data-row-side` etc.) is CT-25's and is left alone.

## Gaps
None found: every local feature maps onto the theme's API (title aside in `title`, external link via `linkComponent`,
`data` via rest props). If the screenshots show a theme defect, it is filed in SOFTURE/AI.
