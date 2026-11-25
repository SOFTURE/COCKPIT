# Research: list-rows-one-shape

Master at 6860952 (CT-11, CT-12, CT-14, CT-15, CT-16, CT-17, CT-21 merged).

## How the rows are laid out today
- `src/shell/status-action-fold-row.tsx` (CT-11): a folding row whose bar has a right column, the status on top and
  the action under it. Only for `FoldRow`s (roadmap items); a plain list row has no equivalent.
- `src/routines/fired-issue-row.tsx` (CT-15): the closest to the target: identity left, a `Badge` tag on top of the
  right column, Retry under it, lit on hover. Its layout is inline.
- Broadcast history (`app/(app)/broadcast/page.tsx`): the link fills the row (`ROW_SURFACE_CLASS`), the trash can laid
  over it with a fixed `pr-14` reserve, after the arrow.
- Broadcast detail (`app/(app)/broadcast/[id]/page.tsx`): state and fires next to the name (`data-send-line`), Issue
  and Retry as loose buttons that wrap after the identity.
- Scan status, watched repositories, team members: the state or tags next to the name; the trash can (CT-16) on the
  right; no right column.
- Routines tab rows: an icon-only state, the name, a kind badge and the last-call badge in one line; the switch, Test,
  Replace token and the trash can on the right.

## Result colours today (two primitives)
- `Status` (ghost text): `SendStatus` (done green, sent blue, failed orange, sending gray), `FireStatus` (sent green,
  failed orange, queued blue, sending/no routine gray), `ReadStatus` (ok green, no state yellow, too old orange,
  invalid/not readable red, unavailable orange, never gray), `RepositoryStatus` (readable green, no state yellow,
  missing permissions orange), the routine's on/off mark.
- `Badge` tag (filled): fired-issue state (fired green, failed red, pending blue, no routine gray), last call (ok green,
  failed red).
The same meaning (failed) is orange in one place and red in another; pending is blue or gray.

## SOFTURE packages
`@softure-ai/theme-notion` 0.31.0 has `List`, `ListItem`, `ListRow` (density-aware rows, `LIST_CLASSES`) and the tone
vocabulary `TONES`/`TONE_COLORS` (success green, warning orange, danger red, muted gray). It has no row with a right
column (state on top, actions under it) and no result badge. The tones cover the colour map, so the app keeps only
"which result takes which tone"; the row with a state/actions column is a generic gap any SOFTURE app with lists hits:
file it in SOFTURE/AI and build it locally on the theme's tokens until it lands.

## Tests that read these rows
- e2e: `broadcast.spec.ts` (history row geometry: the lit box starts with the list item, the trash inside it after
  the arrow), `routines.spec.ts` (`data-send-line`, `data-fire`, `data-routines`, `data-last-call-badge`,
  `data-fired-*`), `scan.spec.ts`, `watched-repositories.spec.ts`, `team.spec.ts`, `polish.spec.ts` (list labels and
  text). Their `data-*` selectors and list names stay; the history geometry asserts the row (`li`) as the lit box.
- unit: `tests/routines/fired-issue-row-markup.test.tsx` pins `bg-<colour>-tag`, the tooltip and `data-fired-badge`.

## Notes
- `IssueWakeStatus` is also used by the inbox (CT-19 scope): split the fires from the Retry so the broadcast detail can
  put the fires in the state slot and Retry among the actions, and keep `IssueWakeStatus` for the inbox.
