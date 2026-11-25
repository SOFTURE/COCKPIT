# Research: fire-status-beside-send-state

## How it works today
- `src/routines/wake-chip.tsx` → `FireStatus` renders each fire as `fireLine` = "{routine}: {state}" (for example
  "Coordinator: Routine fired"); only the `no_routine` line has no routine name. `describeFire` builds the state with
  the HTTP status and the reason for a failed or queued fire.
- `IssueWakeStatus` (same file) lists an issue's fires and a Retry. It is used in three places:
  `app/(app)/broadcast/[id]/page.tsx` (each project's send, on its own line under the name and "Sent"),
  `src/inbox/inbox-row.tsx` (already on the answer's line) and `src/routines/routines-section.tsx` (Recent fires,
  under the issue title; CT-15 reworks that card).
- `Status` from `@softure-ai/theme-notion` takes a `title` (defaults to its plain text), so the routine name can move
  to the tooltip without a new component.
- Tests: `e2e/routines.spec.ts` asserts "Coordinator: Routine fired" and "Coordinator: Fire failed · HTTP 503 · API
  error" on the broadcast page. No unit test renders `IssueWakeStatus`; `tests/inbox/inbox-row-markup.test.tsx` shows
  the `renderToStaticMarkup` pattern.

## Touches
`src/routines/wake-chip.tsx`, `app/(app)/broadcast/[id]/page.tsx`, `e2e/routines.spec.ts`, a new
`tests/routines/wake-chip-markup.test.tsx`. Copy: none new (`fireStates`, `fireLine` stay; `fireLine` becomes the
tooltip).

## SOFTURE modules
`Status` (theme-notion) covers the tooltip. No gap.

## Risks
None. No data, no migration.

## Notes
- The draft patch (`cockpit/drafts/visual-fixes-draft.patch`) moves `IssueWakeStatus` into the "Sent" line and puts
  the name in the `title`; it matches the item and is used as input.
