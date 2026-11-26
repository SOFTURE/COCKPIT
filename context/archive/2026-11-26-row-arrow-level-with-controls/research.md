# Research: row-arrow-level-with-controls

## Today
- theme-notion 0.37.0 `ListEntry` (`src/notion/List.tsx`): `list-entry-side` is `flex items-start gap-2` and holds
  `list-entry-column` (state and controls) and, with `href`, `list-entry-arrow` (`flex h-5 items-center`, a 16 px
  chevron in a 20 px box).
- A control in the column is taller than 20 px: the icon button is 32 px, and below `md` the theme gives every control
  a 44 px touch target. With both at the top, the arrow's middle is 6 px (1280) to 12 px (390) above the control's.
- `app/row-layout.css` (PR #146) already lays the column out as one line with `align-items: center`, so the column has
  one middle; only the side's alignment of the arrow against it is off.

## Rows affected
Every `ListEntry` with `href` and a state or controls: Broadcast → Sent (trash can, the owner's screenshot), overview,
inbox, scheduled runs, fired issues, project page sections, history, deploys, packages, Broadcast project rows.

## Tests
- `e2e/expect-list-entry-rows.ts` is called for every row list in the e2e suite; it checks the shape only, not the
  arrow's position. `e2e/broadcast.spec.ts:245` checks the arrow is right of the trash can, not its height.
