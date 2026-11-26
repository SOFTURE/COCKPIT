# Research: scheduled-tasks-page

## How it works today (master 334d25f)
- `src/shell/navigation.ts` lists the sidebar destinations in order (`NAVIGATION`, typed by `NavigationKey`);
  `src/shell/app-sidebar.tsx` maps each key to a lucide icon in `ICONS` and its label to `copy[item.key]` from the
  `shell` message block. `isActivePath` marks the item `aria-current="page"`.
- `app/(app)/broadcast/page.tsx` is the page standard: `PageLayout`, `PageTabs` + `TabPanel` with `pickTab`/`tabHref`,
  `SectionCard` holding a theme `List density="roomy"` of `ListItem` > `ListEntry` rows (`href` + `AppLink` for a row
  that opens something), times through `createTimeFormatter(config.locale, config.timezone)`.
- Row menus: theme-notion 0.37 `RowActionsMenu` (`actions`, `destructiveAction` with its own `confirm` dialog that stays
  open while the promise runs). `src/routines/routine-forms.tsx` (`buildRoutineMenu`) is the pattern: a pure builder
  tested without the DOM, a client component that binds the server actions.
- CT-36 left: `loadScheduledTasks(db)` (upcoming = scheduled + sending in stored order, done = sent + failed newest
  first), `findScheduledTasks` ordered by `run_at`, and the server actions in `app/(app)/scheduled/actions.ts`
  (`runScheduledTaskNowAction`, `deleteScheduledTaskAction`, both `(formData) => Promise<ScheduledTaskActionState>`).
- A run's broadcast is a normal broadcast: its per-project sends (`findSends(db, null)`, statuses sending, sent,
  failed) say how far it got; `/broadcast/<id>` shows it. A failed run with reason `no_projects` never created its
  broadcast, so it has no detail page.
- Empty states: `src/shell/empty-page.tsx` `EmptyState` on the theme's `Empty`.
- e2e: black-box on a shared PGlite database prepared by `e2e/prepare.ts` (migrations + accounts); specs watch their own
  fictional repositories (fake forge list in `e2e/fake-forge.ts`) and read issues from `/__issues/<fullName>`.
  There is no screen to create a task until CT-38, so the fixture tasks are inserted by `e2e/prepare.ts`.
- Unit guards that list callers: `tests/shell/list-entry-rows.test.tsx` (`ROW_FILES`),
  `tests/shell/result-badge-callers.test.tsx`, `tests/shell/navigation.test.ts` (order).

## Answers to the unknowns
- Done-row badge: computed from the run's sends: any failed → danger "Failed in F of T"; else any sending → muted
  "Sending"; else success "Sent S of T". A failed run (no broadcast) → danger "Not sent" with its reason, no link.
- A task being sent (status `sending`) stays in the Scheduled tab (CT-36's split) with a muted "Sending" badge and no
  menu: neither Run now nor Delete is allowed for it.
- "Mon 30 Nov, 08:00": a weekday formatter beside `createTimeFormatter` in `src/projects/format-time.ts`; the relative
  "in 3 days" through `Intl.RelativeTimeFormat` in the app's locale.

## Risks
- The phone sheet gains one item; `e2e/sidebar-footer.spec.ts` checks the account footer at 390 × 844.
- The e2e Run now creates a broadcast in the shared database; the broadcast spec reads counts from the page, never
  fixed upfront, so it is unaffected.

## SOFTURE modules
- theme-notion 0.37: `ListEntry`, `RowActionsMenu`, `ResultBadge`, `Empty`; nothing missing.
