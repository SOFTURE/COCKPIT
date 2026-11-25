# Plan: delete-in-confirm-dialog

## Approach
Add one shared client component `ConfirmDeleteButton` in `src/shell/` (trash can → theme `AlertDialog` → hidden
fields + Delete submits the server action; buttons disabled while pending, dialog closes when the action finishes).
`DeleteBroadcastButton` becomes a thin wrapper over it. On the Broadcast page the trash can moves inside the row's
box: the `li` is `relative`, the link takes right padding, the button sits absolutely after the arrow, and hovering
the row lights the link.

## Key decisions
- Sibling, not child, of the link (no interactive content inside `<a>`).
- Generic copy object and `fields` record so CT-12 reuses the component for routines without changes.
- No new message keys; the existing broadcast strings fill the dialog.

## Phase 1: Shared confirm dialog and the trash can inside the row (test-after)
- `src/shell/confirm-delete-button.tsx` (new), `src/broadcast/delete-broadcast-button.tsx`,
  `app/(app)/broadcast/page.tsx`, `e2e/broadcast.spec.ts`, `CHANGELOG.md`.
- Done when: the broadcast e2e cancels and deletes through an `alertdialog`; an e2e checks the trash can's box lies
  inside the row link's box; screenshots at 1280 and 390, light and dark, show the row and the dialog; gates green.

## Progress

### Phase 1: Shared confirm dialog and the trash can inside the row
- [x] 1.1 `ConfirmDeleteButton` and the broadcast wrapper — 705f7ae
- [x] 1.2 Trash can inside the row's box on the Broadcast page — 705f7ae
- [x] 1.3 e2e: cancel and delete through the dialog; the trash can lies inside the row (`e2e/broadcast.spec.ts` 4/4 passed) — 705f7ae
- [x] 1.4 Evidence screenshots (row and dialog, 1280/390, light/dark) looked at: `cockpit/evidence/delete-in-confirm-dialog/01-history-row-after-<width>-<theme>.webp`, `cockpit/evidence/delete-in-confirm-dialog/02-delete-confirm-after-<width>-<theme>.webp` — 705f7ae
- [x] 1.5 Gates green: typecheck, lint (language scan), test (vitest), broadcast e2e, doctor; full suite in CI — 705f7ae
