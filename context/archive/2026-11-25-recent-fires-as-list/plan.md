# Plan: recent-fires-as-list

## Approach
Read only the fires of the last 14 days (SQL `created_at >= now - 14 d`, the row limit kept), and give each fired issue
its fire time and one overall state. The "Recent fires" card renders one row per issue in the shared bar layout:
`#N title` and the fire's date and time on the left, a state badge on top of the right column (green fired, red
failed, blue queued or firing, grey no routine; the per-routine detail in the badge's tooltip), Retry under it.

## Key decisions
- The issue's state: `failed` if any fire failed, else `pending` if any is queued or firing, else `no_routine` if
  that is all it has, else `fired`.
- The issue's time is the newest `createdAt` of its fires (a Retry does not move it).
- `findRecentFires` takes an options object `{ limit, since }` (more than three inputs).
- The Retry form is extracted from `IssueWakeStatus` as `RetryWakeForm` and reused, so the broadcast page and inbox
  keep theirs unchanged.

## Phase 1: Two weeks of fires as rows

- Files: `modules/projects/routines.ts`, `src/routines/load-routines.ts`, `src/routines/routines-tab.ts`,
  `src/routines/wake-chip.tsx`, `src/routines/fired-issue-row.tsx` (new), `src/routines/routines-section.tsx`,
  `messages/en.ts`, `messages/pl.ts`, `tests/routines/routines-tab.test.ts` (new),
  `tests/routines/fired-issue-row-markup.test.tsx` (new), `tests/routines/manage-routines.test.ts`,
  `e2e/routines.spec.ts`, `CHANGELOG.md`.
- Mode: TDD (unit tests for the window and the state first).
- Done when: unit tests cover the window boundary (exactly 14 days in, older out), each state and its badge colour,
  the date line and Retry only where it applies; the e2e checks the row's badge, date line and title; screenshots at
  1280 and 390 in light and dark are looked at; gates green; PR CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Two weeks of fires as rows

#### Automated
- [x] 1.1 Unit tests: 14-day window, issue state, fire time, row markup (badge colour, date, Retry) — 528adfb
- [x] 1.2 `findRecentFires({ limit, since })`, `buildRoutinesTab(..., now)`, `FiredIssueRow`, copy in both dictionaries — 528adfb
- [x] 1.3 e2e `routines.spec.ts` asserts the row's badge, date line and title (2/2 passed locally) — 528adfb
- [x] 1.4 Screenshots at 1280 and 390, light and dark, looked at and stored under the change's evidence folder (evidence `recent-fires-as-list/01-recent-fires-after-{1280,390}-{light,dark}.webp`) — 528adfb
- [x] 1.5 Gates green: typecheck, lint (language scan), test (698/698), build + e2e routines (2/2), doctor — 528adfb
