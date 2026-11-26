# Plan: scheduled-task-repeat

## Approach
Keep one row per planned run and chain the runs of a repeating task by a `series_id` (research option 2). Migration
0011 adds `repeat` (`none`/`daily`/`weekly`), `paused` and `series_id` with the two unique indexes. The claim of a
repeating occurrence inserts the next occurrence in the same transaction; a pure `getNextRunAt` computes it with core's
helpers. Pause and resume flip `paused` on the upcoming occurrence; the claim skips paused rows. The dialog gains the
repeat choice, the row its repeat word and the Paused badge, the menu Pause/Resume.

## Key decisions
- D1: next time = the first point `planned + k × period` (local wall clock, `k ≥ 1`) after both the planned time and
  now, from `getWallClock`/`addCalendarDays`/`getZonedInstant` (`src/scheduled/next-run-at.ts`). It keeps 08:00 at
  08:00 across DST and makes a missed run fire once.
- D2: the spawn happens only on `scheduled → sending` (the claim's CTE returns the previous status), in one transaction
  with the claim; insert `ON CONFLICT DO NOTHING` (unique `(series_id, run_at)` and one `scheduled` row per series).
  The claim takes a `getNextRunAt` callback, so the module holds no time-zone policy.
- D3: "Run now" on a repeating task inserts a copy already claimed (`status = 'sending'`, `repeat = 'none'`, same
  series, `run_at` = now) and sends it; the occurrence keeps its time. A one-off task is claimed as before.
- D4: pause = `paused = true` on a `scheduled` row (check `NOT paused OR status = 'scheduled'`); resume clears it and,
  for a repeating task whose time passed while paused, moves it to the next point after now (a paused task skips its
  runs); a one-off resumed after its time fires on the next tick, like any missed time.
- D5: edit may change `repeat`; delete removes the upcoming occurrence (the series' future), Done rows stay.
- D6: UI: dialog `RadioGroup` under When in one row ("No", "Daily", "Weekly on <weekday of the date>"), labels 44 px on
  a phone; posted as a hidden `repeat` input (the form is submitted by hand). Row: "N projects · weekly · <prompt>";
  paused row: grey tag "Paused" instead of the time. Menu: Edit, Run now, Pause/Resume, separator, Delete.
- D7: messages: own block `scheduledRepeat` (en, pl); a refused pause reuses `scheduled.not_scheduled` ("This task has
  already fired."), so no new error code.

## Phase 1: Data and firing (TDD)
Migration 0011, schema, module (insert/update with repeat, claim with spawn, run-now copy, pause, resume),
`next-run-at.ts`, run and save changes. Tests: next time daily/weekly across 2026-03-29 and 2026-10-25 in
Europe/Warsaw, missed periods; integration: weekly task fires, gets its next time, fires again a week later, one issue
per project per run; takeover spawns nothing; run now leaves the occurrence; pause and resume.

## Phase 2: Dialog, row, menu, page, messages
Form state (repeat labels), dialog radio, row/menu/page, actions (repeat field, pause/resume), messages; unit tests.

## Phase 3: e2e and evidence
`e2e/scheduled.spec.ts` at 1280 and 390: create a weekly task, Run now, the row stays in Scheduled with its time and the
run shows in Done; pause and resume. Screenshots: dialog with the repeat choice, a repeating and a paused row, 1280 and
390, light and dark, looked at. Build and full e2e.

## Merge
PR to master, all CI jobs green, coordinator's go, merge, master CI green on the merge commit.

## Progress

### Phase 1: Data and firing
#### Automated
- [ ] 1.1 Next time: daily and weekly across both 2026 DST changes, missed periods
- [ ] 1.2 Integration: weekly fires, next time, fires again a week later; one issue per project per run; takeover spawns nothing; run now keeps the occurrence; pause and resume

### Phase 2: Dialog, row, menu, page, messages
#### Automated
- [ ] 2.1 Form state, menu and row tests; gates green (typecheck, lint, test)

### Phase 3: e2e and evidence
#### Automated
- [ ] 3.1 e2e at 1280 and 390: weekly task, Run now, pause and resume
- [ ] 3.2 Screenshots of the dialog and the repeating and paused rows, light and dark, inspected
- [ ] 3.3 Build and full e2e green
