# Plan: delete-sent-broadcast

## Approach
Add `deleteBroadcast(db, id)` to `modules/projects/broadcasts.ts` (one parameterized delete; the cascade removes the
sends; returns whether a row went). Add `deleteBroadcastAction` to the broadcast actions: `requireUser()`, zod-validate
the id, delete, `revalidatePath("/broadcast", "layout")`. On the list, each row becomes the link plus a client
`DeleteBroadcastButton`: a trash-can icon button (`aria-label` "Delete <title>"), which on click turns the row's right
side into a confirm ("Delete this broadcast from COCKPIT? Its issues in the projects stay.") with "Delete" and
"Cancel". The row keeps its styling; the list item only becomes a flex row
that holds the link and the button (row margins are fixed app-wide in a separate change).

## Key decisions
- Delete only COCKPIT's record; never touch the created issues (AGENTS.md: read-only toward watched repositories
  except creating issues). The confirm copy says the issues stay.
- Hard delete, no undo: the record is COCKPIT's own history and the confirm step guards it.
- Inline confirm in the row (as in the inbox), not a modal.

## Phase 1: Delete a sent broadcast

- Files: `modules/projects/broadcasts.ts`, `app/(app)/broadcast/actions.ts`, `app/(app)/broadcast/page.tsx`,
  `src/broadcast/delete-broadcast-button.tsx`, `messages/en.ts`, `messages/pl.ts`,
  `tests/broadcast/delete-broadcast.test.ts`, `e2e/broadcast.spec.ts`, `CHANGELOG.md`.
- Mode: TDD for the storage function, test-after for the UI (e2e on a production build).
- Done when: the unit test shows the delete removes the broadcast and its sends, leaves another broadcast alone and
  reports false for an unknown id; the e2e deletes a broadcast through the confirm (cancel first keeps it) and sees it
  gone from the list; screenshots at 1280 and 390 in both themes inspected and stored as evidence; gates green; the
  pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Delete a sent broadcast

#### Automated
- [x] 1.1 `deleteBroadcast` with a unit test (removes the broadcast and its sends, leaves others, false for unknown id; `tests/broadcast/delete-broadcast.test.ts` 3/3, red before the function) — 7a6a894
- [x] 1.2 `deleteBroadcastAction`, trash-can button with confirm on each row; copy in en and pl — 7a6a894
- [x] 1.3 e2e covers cancel and delete through the confirm, the issues staying, and the button's 44 px on a phone (production build; `e2e/broadcast.spec.ts` 4/4) — 7a6a894
- [x] 1.4 Screenshots at 1280 and 390, light and dark, inspected and stored as evidence (`cockpit/evidence/delete-sent-broadcast/{01-list,02-confirm}-after-{1280,390}-{light,dark}.webp`: trash can at the row's end; the confirm sits on the right at 1280 and wraps under the row at 390) — 7a6a894
- [x] 1.5 Gates green: typecheck, lint (language scan), test (635/635), doctor — 7a6a894
