# Research: row-actions-menu-everywhere

## How it works today
- `app/(app)/broadcast/[id]/page.tsx` renders each project send as one `ListRow` whose `actions` slot is a list of up
  to three controls: the Issue link button (when the send has an issue), `RetryWakeForm` from
  `src/routines/wake-chip.tsx` (when the issue's fires can be retried: a failed, queued or `no_routine` fire) and the
  Retry send form (state `failed` or `sending`).
- CT-22's `RowActionsMenu` (`src/shell/row-actions-menu.tsx`) takes items as data (`RowAction`: id, label, icon,
  onSelect, isDisabled, isDestructive, opensDialog) and is a client component; the routine row
  (`src/routines/routine-forms.tsx`, `RoutineRowControls`) calls a server action from an item through
  `startTransition(() => action(formData))`.
- Server actions: `retryBroadcastSendAction(formData)` (fields `broadcastId`, `repository`; `revalidatePath` of the
  detail) in `app/(app)/broadcast/actions.ts`; `retryIssueWakeAction(formData)` (fields `repositoryKey`,
  `issueNumber`; `refresh()`) in `app/(app)/routines/actions.ts`. Both take a plain `FormData`, so a menu item can
  build one and call them; no change to the actions.

## Which combinations happen
From `src/broadcast/build-broadcast-view.ts` and `src/broadcast/send-broadcast.ts`:
- `sent` / `done` with an issue; its fires exist once the issue exists (`wakeAfterIssue`), and a project without a
  wake routine gets a `no_routine` fire, which `canRetry` counts. So a sent project without a routine shows Issue +
  Retry fire today: the common two-control row.
- `failed`: no issue (the issue is recorded only on success), so Retry send alone.
- `sending` (stale claim): no issue recorded yet, Retry send alone. A send with an issue and a Retry send at once only
  comes from stored data the UI cannot produce (e.g. a send set back to `sending` after an issue was recorded); the
  rule must still hold for it, so it is covered by a unit test, not the e2e.

## Unknown resolved
- Which control stays inline: Retry send when the send failed or is stuck sending (the row exists to be retried),
  otherwise the Issue link. Retry fire never stays inline next to another control; alone it stays inline.

## Other rows (survey re-checked on master 81b38ff)
- `actions={[` remains in `app/(app)/inbox/page.tsx` and `src/adapters/packages/packages-details.tsx`: text, not
  controls; CT-24 owns them.
- Single-action rows stay inline: Settings' watched repositories and Team (`ConfirmDeleteButton`), Broadcast history
  (delete), Recent fires (`RetryWakeForm`, `src/routines/fired-issue-row.tsx`).

## Tests touched
- `e2e/broadcast.spec.ts`: rows `herald-app`/`herald-web` (sent, `no_routine` fire) and `herald-docs` (failed).
- `e2e/routines.spec.ts` clicks `Retry waking signal-web for issue #1` on the broadcast detail: that control moves into
  the menu, so the spec opens the menu instead (CT-24 does not touch it).
- No DOM test environment (SOFTURE/AI#1487): markup is checked with `renderToStaticMarkup`, interaction in the e2e.

## Risks
- The Issue item in a menu cannot be an `<a>` without changing the shared `RowAction` shape; it opens the issue with
  `window.open(url, "_blank", "noopener,noreferrer")`, which keeps the link's no-referrer behaviour.
- `wake-chip.tsx` is read by CT-24's inbox: only additive change (a field helper), no behaviour change there.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
