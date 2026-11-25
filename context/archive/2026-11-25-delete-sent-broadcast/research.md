# Research: delete-sent-broadcast

## Where it lives
- Storage: `modules/projects/broadcasts.ts` (`saveBroadcast`, `findBroadcasts`, `findSends`, ...). Tables from
  migration `0005_create_broadcasts.sql`: `broadcast_sends.broadcast_id` references `broadcasts(id) ON DELETE
  CASCADE`, so one `DELETE FROM broadcasts WHERE id = $1` removes the sends too. No migration is needed.
- Actions: `app/(app)/broadcast/actions.ts` (`sendBroadcastAction`, `retryBroadcastSendAction`), each calls
  `requireUser()` first and validates its form with zod.
- List: `app/(app)/broadcast/page.tsx` renders each broadcast as one `AppLink` row with
  `-mx-2 px-2 ... hover:bg-accent`: the negative margin pushes the hover background 8 px past the card's content
  edge on both sides, which is the misalignment the owner saw.
- Detail page `app/(app)/broadcast/[id]/page.tsx` shows `not_found` copy for an unknown id, so a deleted broadcast's
  old link degrades cleanly.

## Races
- A send still `creating` when its broadcast is deleted: `markSendSent`/`markSendFailed` update by id and match no row,
  so they do nothing; the forge issue (if created) stays in the project, as for any delete.
- A resubmitted compose form with the deleted broadcast's id would recreate it; that needs the old page still open and
  is the same broadcast by design. Accepted.

## Reuse
- Confirm step: the inbox `AnswerForm` pattern (a client component; a first click opens a confirm with a primary and a
  ghost button, `size="touch"` plus `md:h-7 md:px-2.5`).
- `Button` from `@softure-ai/theme-notion` (variants `outline`, `ghost`, `destructive`), `Trash2` from lucide-react.

## Tests touching it
- `tests/broadcast/send-broadcast.test.ts` builds a PGlite context with `createTestContext`; a storage test for the
  delete fits there or in a new `tests/broadcast/delete-broadcast.test.ts`.
- `e2e/broadcast.spec.ts` sends broadcasts and reads the list "Sent broadcasts, newest first": a delete step fits after
  the existing flow.
