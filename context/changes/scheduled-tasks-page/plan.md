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
- [ ] 1.1 Navigation lists Scheduled tasks after Broadcast
- [ ] 1.2 Row models: relative time, "N projects", badge tone per outcome, sending row without menu
- [ ] 1.3 Tab counts and sorting of both tabs

### Phase 2: Page, rows, menu, messages

#### Automated
- [ ] 2.1 Menu builder: Run now, then Delete with its confirm copy
- [ ] 2.2 Row files on ListEntry and ResultBadge guards; gates green (typecheck, lint, test)

### Phase 3: e2e and evidence

#### Automated
- [ ] 3.1 `e2e/scheduled.spec.ts` green at 1280 and 390 px
- [ ] 3.2 Screenshots of both tabs, the open menu and the delete dialog, light and dark, inspected
- [ ] 3.3 Build and full e2e green
