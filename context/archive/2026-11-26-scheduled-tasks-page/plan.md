# Plan: scheduled-tasks-page

## Approach
A server page `/scheduled` built like Broadcast: `PageLayout`, `PageTabs` (Scheduled, Done, counts, `?tab=`), one
`SectionCard` per tab with a theme `List` of `ListEntry` rows or the theme's `Empty`. A pure view module turns stored
tasks and their sends into row models (tested without the DOM); two row components render them; a client row menu on
`RowActionsMenu` binds Run now and Delete (confirm in the menu's own dialog). The sidebar gets the item after Broadcast.

## Key decisions
- D1: page data in `src/scheduled/load-scheduled-page.ts`: `loadScheduledTasks` + `findSends(db, null)` grouped by
  broadcast id (no fires or reads, so the page stays light).
- D2: row models in `src/scheduled/build-scheduled-rows.ts`: `buildScheduledRow` (title, "N projects · first prompt
  line", time, relative time, `isSending`), `buildDoneRow` (title, "N projects · planned <time>", badge kind + counts,
  sent time, href only when the broadcast has sends).
- D3: time formats in `src/projects/format-time.ts`: `createWeekdayTimeFormatter` and `formatRelativeTime` (minutes,
  hours, days).
- D4: messages in a new `scheduledPage` block in `messages/en.ts` and `messages/pl.ts`; `shell.scheduled` for the item.
- D5: a failed menu action is shown in a `role="alert"` line under the row's controls (the routine menu's pattern of
  announcing the result), cleared on the next action.
- D6: e2e fixture tasks are inserted by `e2e/prepare.ts` relative to the start time, for two repositories only this
  spec watches (`example-org/almanac-app`, `example-org/almanac-web`); the spec runs serially.

## Phase 1: Navigation, formats and row models (TDD)
Navigation order test, format tests, row model tests (relative time, "N projects", badge per outcome), tab counts and
sorting (`loadScheduledPage`).

## Phase 2: Page, rows, menu, messages
`app/(app)/scheduled/page.tsx`, `scheduled-task-row.tsx`, `scheduled-run-row.tsx`, `scheduled-row-menu.tsx`, messages,
sidebar icon; row file guards (`ROW_FILES`, result badge callers); gates.

## Phase 3: e2e and evidence
`e2e/scheduled.spec.ts` at 1280 and 390 px: sidebar item and `aria-current`, both tabs in order, Run now to Done with
its badge, Delete with cancel and confirm, done row opens its broadcast, empty state; screenshots of both tabs, the
open menu and the delete dialog, light and dark, looked at and fixed. Build + full e2e.

## Merge
PR to master, all CI jobs green, coordinator's go, merge, master CI green on the merge commit.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Navigation, formats and row models

#### Automated
- [x] 1.1 Navigation lists Scheduled tasks after Broadcast — 5741417 (`tests/shell/navigation.test.ts` 2/2)
- [x] 1.2 Row models: relative time, "N projects", badge tone per outcome, sending row without menu — 5741417 (`tests/scheduled/build-scheduled-rows.test.ts` 10/10, `tests/projects/format-time.test.ts` 4/4, `tests/shell/result-badge-callers.test.tsx`)
- [x] 1.3 Tab counts and sorting of both tabs — 5741417 (`tests/scheduled/load-scheduled-page.test.ts` 2/2)

### Phase 2: Page, rows, menu, messages

#### Automated
- [x] 2.1 Menu builder: Run now, then Delete with its confirm copy — 5741417 (`tests/scheduled/scheduled-row-menu.test.tsx` 3/3)
- [x] 2.2 Row files on ListEntry and ResultBadge guards; gates green (typecheck, lint, test) — 5741417 (unit 916/916)

### Phase 3: e2e and evidence

#### Automated
- [x] 3.1 `e2e/scheduled.spec.ts` green at 1280 and 390 px — 5741417 (4/4; a nowrap detail line made the page scroll sideways by 7 px at 390 px, fixed with `line-clamp-1`)
- [x] 3.2 Screenshots of both tabs, the open menu and the delete dialog, light and dark, inspected — 5741417 (/mnt/project-files/cockpit/evidence/scheduled-tasks-page/ 01-scheduled, 02-row-menu, 03-done-empty, 04-delete-dialog, 05-done; 1280 and 390, light and dark: no wrap, overlap or misalignment)
- [x] 3.3 Build and full e2e green — 5741417 (`npm run build && npm run e2e`: 112 passed, 1 failed `sign-in.spec.ts` on the old navigation list, updated in the archive commit and re-run 5/5)
