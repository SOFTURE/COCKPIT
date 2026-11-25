# Plan: fire-status-beside-send-state

## Approach
The shared `FireStatus` in `src/routines/wake-chip.tsx` shows only the fire's state; the routine's name goes to the
`Status` tooltip ("Coordinator: Routine fired"). Every screen that shows fires (broadcast page, inbox, Recent fires)
uses that one component, so the change applies app-wide. On the broadcast page the fires move onto the line with the
project name and "Sent".

## Key decisions
- Keep the existing copy: "Routine fired", "No routine to fire", "Fire failed · HTTP 503 · reason". `fireLine` stays
  and fills the tooltip.
- The send line carries `data-send-line` so the e2e can check the fire sits beside "Sent".

## Phase 1: State only, beside "Sent" (TDD for the markup, test-after for the e2e)
- 1.1 Markup test first: `IssueWakeStatus` renders "Routine fired" without the routine's name in the visible text,
  and the name in the `title`; a failed fire keeps HTTP status and reason. Fails before the change.
- 1.2 `FireStatus`: visible text = `describeFire`; `title` = `fireLine` with the routine (no title override for
  `no_routine`).
- 1.3 Broadcast page: `IssueWakeStatus` inside the line with the name and `SendStatus`, marked `data-send-line`.
- 1.4 e2e `e2e/routines.spec.ts`: the send line contains "Sent" and "Routine fired" / "Fire failed · HTTP 503 · API
  error", and not "Coordinator:".
- 1.5 Gates: typecheck, lint (language scan), test, routines e2e; screenshot of the broadcast page looked at.

Done when: unit and e2e pass, the screenshot shows the state on the "Sent" line.

## Progress

### Phase 1: State only, beside "Sent"
- [x] 1.1 Markup test first (`tests/routines/wake-chip-markup.test.tsx` failed on "Coordinator: Routine fired", then 3/3 passed) — cbe1d69
- [x] 1.2 `FireStatus` shows the state, the name in the tooltip — cbe1d69
- [x] 1.3 Broadcast page: fires on the "Sent" line (`data-send-line`) — cbe1d69
- [x] 1.4 e2e reads the state beside "Sent" (`e2e/routines.spec.ts`, broadcast and inbox specs 9/9 passed) — cbe1d69
- [x] 1.5 Gates green: typecheck, lint (language scan), test (vitest 686/686); screenshots looked at: `cockpit/evidence/fire-status-beside-send-state/01-fire-line-after-{1280,390}-{light,dark}.webp` — cbe1d69
