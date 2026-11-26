---
project: "COCKPIT"
roadmap: cockpit-v4
version: 4
status: ready
prd_version: 3
updated: 2026-11-26
---

# Roadmap cockpit-v4: a list row says each fact once and keeps its controls tidy

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: not ordered (no release, tag, publish or deploy without the owner's word); the owner's order of
>   2026-11-26 08:54Z (F-6): theme-notion 0.36.0/0.37.0 closed the package gaps, so the next release waits for
>   CT-25..CT-29, all five (replaces F-4's narrower order); widened on 2026-11-26 09:24Z (F-7, coordinator's note of
>   the owner's "one deployment of everything at the end") to CT-25..CT-35
> - Parallelism: up to 4 at once
> - Owner at the keyboard: none
> - Source: the owner's feedback of 2026-11-25 (F-1 below, with a screenshot of a routine row), not a PRD revision
> - Start: the owner's standing rule that every UI fix is a shared component applied app-wide, rolled out as separate
>   items (2026-11-25 12:26Z)

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CT-22** | `routine-row-tidy` | a routine row says its on/off state once (the switch) and its last call once (one badge), and keeps Test, Replace token and Delete in one row menu beside the switch, built as the shared `RowActionsMenu` | — | autonomous | done_code (2026-11-25; waiting: release) |
| **CT-23** | `row-actions-menu-everywhere` | every list row with more than one control shows at most one inline control plus CT-22's row menu; a row with one action keeps it inline | CT-22 | autonomous | done_code (2026-11-25; waiting: release) |
| **CT-24** | `row-facts-said-once` | no list row in COCKPIT shows a fact twice or puts plain information in its controls slot, pinned by a test | CT-22 | autonomous | done_code (2026-11-25; waiting: release) |
| **CT-25** | `fold-rows-on-theme-status` | the roadmap's item rows use theme-notion's `FoldRow` `status` and `actions` column; the local `StatusActionFoldRow` is deleted | — | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-26** | `list-rows-on-theme-list-entry` | every list row in COCKPIT is theme-notion's `ListEntry` (row menus in its `menu` slot); the local `ListRow` is deleted | — | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-27** | `row-menus-on-theme-row-actions-menu` | every row menu is theme-notion's `RowActionsMenu`; the local `RowActionsMenu` is deleted | CT-26 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-28** | `result-badges-on-theme-result-badge` | every result badge is theme-notion's `ResultBadge`; the local `ResultBadge` is deleted | CT-26 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-29** | `project-page-opens-on-waiting` | a project's page opens on its Waiting tab unless the address names another tab, whatever the project reports (production included) | — | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-30** | `project-groups-in-settings` | the owner defines project groups in Settings (add, rename, delete); every project belongs to at most one, the existing ones start grouped by forge owner; the shared `groupProjects` rule | CT-27, CT-28 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-31** | `project-settings-tab` | every project page has a last tab "Ustawienia" whose dropdown sets the project's group, saved at once | CT-29, CT-30 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-32** | `grouped-project-lists` | the Projects page and the Settings watched list show one section per group (No group last), through the shared `ProjectGroupSections` | CT-30 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-33** | `grouped-sidebar` | the sidebar's project links sit under one label per group | CT-30 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-34** | `grouped-broadcast-picker` | the Broadcast project picker shows one fieldset per group with a select-the-group checkbox | CT-30 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-35** | `grouped-other-project-lists` | Scan status, Packages and Deploys list their projects in the same group sections | CT-32 | autonomous | ready |
| **CT-36** | `scheduled-tasks-store-and-fire` | a stored scheduled task (title, prompt, local time, projects) sends itself once at its time as a broadcast: one cockpit issue per project, routines woken; no screen yet | — | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-37** | `scheduled-tasks-page` | a "Scheduled tasks" sidebar item opens a page with Scheduled and Done tabs of theme rows; Run now and Delete in the row menu | CT-36, CT-33 | autonomous | done_code (2026-11-26; waiting: release) |
| **CT-38** | `scheduled-task-dialog` | "New task" and "Edit" open one dialog (title, prompt, date and time, grouped project picker moved into the shared `ProjectPicker`) | CT-37, CT-34 | autonomous | ready |
| **CT-39** | `scheduled-task-repeat` | a task can repeat daily or weekly at the same local time, and be paused | CT-38 | autonomous | ready |

## Order

**Feedback points (no PRD FR), owner, 2026-11-25:**
- F-1 (owner, 2026-11-25 21:09Z, translated, with a screenshot of a routine row on a project's Routines tab): "lay it
  out sensibly, because it is a terrible mess". The screenshot shows, right-aligned with an empty left area: a lone
  green check icon, then a separate green "HTTP 200" badge with its own check icon (the state twice), and on a second
  line the switch labelled "Enabled" (the on/off state a third time), Test, "Replace token" and a trash icon, scattered.
- F-2 (owner's standing rule, 2026-11-25 12:26Z): every UI fix is a standard, a shared component applied app-wide;
  the app-wide rollout goes as separate roadmap items.
- F-3 (owner, 2026-11-26 07:15Z, translated): "the changes that are done in the Notion package: bump them and carry
  them out still before the deployment, so that the app is switched over to the newest package". The nightly bump
  (PR #124, master 8b630c2) brought `@softure-ai/theme-notion` 0.35.0, which ships `ListEntry` with a `menu` slot,
  `ResultBadge`, `RowActionsMenu` and `FoldRow` `status` (0.32); COCKPIT still renders its own copies of all four
  (CT-11, CT-18, CT-22). CT-25..CT-28 move every screen onto the package components and delete the local copies.
- F-4 (owner, 2026-11-26 07:26Z, translated): "release with what you have, and I have kicked the rest so it gets
  done": the release goes out once CT-25 and CT-26 are merged; CT-27 and CT-28 (waiting for SOFTURE/AI#1492 and #1493)
  go into the next release.
- F-5 (owner, 2026-11-26 07:47Z, translated, with a screenshot of a project page opened on Production): "add to the
  current roadmap that the Waiting tab always opens by default, not Production; where there is production, Production
  opened for me instead of Waiting, so fix it so Waiting is always the default". Rides the same release as CT-25 and
  CT-26 (coordinator's note of the owner's order).
- F-6 (owner, 2026-11-26 08:54Z, translated): "everything is released: theme-notion 0.37.0 is on npm with #1495
  (`FoldRow align="start"`) and #1497 (`ListEntry`), and 0.36.0 went out before it with #1492 and #1493; all four
  issues are closed and nothing waits; take the fixes into account right away". CT-27 and CT-28 are unblocked and join
  this release: the release waits for CT-25..CT-29. Their first phase bumps `@softure-ai/theme-notion` to `^0.37.0`
  (the first of them to run; the second re-merges master) and reads the 0.36.0/0.37.0 CHANGELOG for the final API.
- F-7 (owner, 2026-11-26 09:24Z, translated, with a screenshot of the Broadcast project picker: twelve checkboxes,
  the repositories of a personal account and of an organization mixed in one grid): "group the projects by theme: all the projects of one account in
  one group, the organization's in another; I define the groups in Settings and decide myself which project is in
  which group; every project gets a Settings tab with a dropdown where I assign its group; then the projects list, the
  sidebar and the pickers are laid out by those groups". Coordinator's note: the same release as CT-25..CT-29; split
  so the shared pieces land first and each surface is its own item. CT-30..CT-35 carry it.
- F-8 (owner, 2026-11-26 10:46Z, translated): "another tool I want in the cockpit, called scheduled tasks: I set the
  date when it should fire the prompt, the issue gets created, and in which repositories; for example I want to check
  code quality in all the projects I pick, but only on Monday once my tokens reset, and it should happen by itself,
  because running it now would eat the allowance I still need tomorrow. Add it as a separate tab on the left in the
  menu, by our existing standard (tabs, a nice UI through a pop-up)". Carried by CT-36..CT-39: the store and the
  firing first (no screen), then the page, then the dialog, then repetition. A scheduled task fires as a broadcast, so
  every issue carries the marker and wakes the project's routines exactly like a broadcast sent by hand (CT-10).

**Framing.** Optimising for: quality of the everyday screens (the owner reads them daily). First proof: CT-22, the
row the owner pointed at, which also builds the shared row menu. Main risk: the rollout touching many screens at
once; it is split by concern (controls in CT-23, facts in CT-24) so two threads run side by side on disjoint files.
Depth: the shared component and its rule in CT-22; the rollouts are mechanical.

**Why this order.** CT-22 lands the shared `RowActionsMenu` and the two rules in `src/shell/list-row.tsx`'s doc
comment, so CT-23 and CT-24 apply a finished standard instead of inventing one. CT-23 and CT-24 then run in parallel.

**Sizes:** S is one screen or a mechanical move of existing controls; M builds a shared component and applies it to
its first screen with tests.

### Starting point
- 2026-11-26 (CT-36..CT-39): a broadcast (`src/broadcast/send-broadcast.ts`) already turns one message into one
  cockpit issue per chosen project, idempotent by its id and marker, and wakes each project's routines; the worker
  runs one-minute schedules (`cockpit.routine-fires`); `@softure-ai/core` has `LocalDateTime` and
  `getLocalDateTimeInstant`; theme-notion 0.37.0 has `Dialog`, `Field`, `Input`, `Textarea`, `RadioGroup` and no date
  picker (SOFTURE/AI#1509, filed in this run); the last migration is `0009_create_project_groups.sql`.
- 2026-11-26 (CT-25..CT-28): `@softure-ai/theme-notion` 0.35.0 on master (`package.json` `^0.35.0`). Local copies to
  replace: `src/shell/list-row.tsx` (`ListRow`, 14 screens), `src/shell/result-badge.tsx` (`ResultBadge`, 15 files),
  `src/shell/row-actions-menu.tsx` (`RowActionsMenu`, routines and broadcast), `src/shell/status-action-fold-row.tsx`
  (`StatusActionFoldRow`, the roadmap view). Package gaps found while comparing the APIs: `RowActionsMenu` cannot keep
  its confirm dialog open while an async delete runs, cannot hand focus to an app's own dialog (Replace token) and
  renders 28 px items on a phone (SOFTURE/AI#1492); `ResultBadge` drops `data-*` attributes the tests read
  (SOFTURE/AI#1493). `ListEntry` and `FoldRow` cover what COCKPIT needs.
- UI (2026-11-25): Next.js app with `@softure-ai/theme-notion` 0.31.0 (`package-lock.json`); local list row
  `src/shell/list-row.tsx` (CT-18) and `src/shell/result-badge.tsx`; theme 0.34.0 on npm now ships `ListEntry` and
  `ResultBadge` (from SOFTURE/AI#1481) and has `DropdownMenu` since 0.31.0.
- Routines tab: `src/routines/routines-section.tsx` (state icon + `LastCallBadge` + four controls),
  `src/routines/routine-forms.tsx` (`RoutineEnabledSwitch`, `TestRoutineForm`, `ReplaceTokenDialog`).
- Confirm dialog: `src/shell/confirm-delete-button.tsx` (CT-14/CT-16).
- Tests: Vitest (`tests/**`), Playwright e2e (`e2e/**`), CI jobs `gates`, `e2e`, `deploy-dry-run`, `cli-package`,
  `context-doctor`.
- Data, auth, deploy: unchanged by this roadmap; no migration.

### Lanes
| Lane | Chain | Owns | Note |
| --- | --- | --- | --- |
| A | CT-22 | `src/shell/row-actions-menu.tsx` (new), `src/shell/list-row.tsx`, `src/shell/confirm-delete-button.tsx`, `src/routines/**` except `wake-chip.tsx` | builds the standard |
| B | CT-23 | `app/(app)/broadcast/[id]/page.tsx`, `src/broadcast/**`, `src/routines/wake-chip.tsx` | after CT-22 |
| C | CT-24 | `src/inbox/**`, `app/(app)/inbox/page.tsx`, `src/adapters/packages/**`, `src/overview/**`, `src/project-page/**`, `src/adapters/deploy/**`, `src/team/**`, `src/projects/**`, `app/(app)/scan-status/**` | after CT-22, parallel with CT-23 |
| D | CT-25 | `src/roadmap/roadmap-view.tsx`, `src/shell/status-action-fold-row.tsx` (deleted), the roadmap e2e specs (`project-page.spec.ts`, `promote.spec.ts`) | starts now, parallel with CT-26 |
| E | CT-26 → CT-27, CT-28 | CT-26: every `ListRow` caller, `src/shell/list-row.tsx` (deleted), `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`, `src/broadcast/send-controls.ts`, the row e2e helpers (`e2e/expect-*.ts`, `tests/support/row-markup.ts`); CT-27: `src/shell/row-actions-menu.tsx` (deleted), `src/shell/confirm-delete-button.tsx`, `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`; CT-28: `src/shell/result-badge.tsx` (deleted) and its 15 callers | CT-27 and CT-28 after CT-26 and their theme fix; CT-27 and CT-28 touch disjoint files except `package.json`/`package-lock.json` (the theme bump): the second to merge re-merges master |
| G | CT-30 | `modules/projects/migrations/0009_*`, `modules/projects/schema.ts`, `modules/projects/groups.ts`, `modules/projects/queries.ts`, `src/projects/load-repositories.ts`, `src/projects/add-repository.ts`, `src/projects/group-projects.ts`, `src/projects/load-project-groups.ts`, `src/projects/project-group*.tsx`, `app/(app)/settings/actions.ts`, the new Settings section in `app/(app)/settings/page.tsx`, `e2e/fixtures.ts` | after CT-27 and CT-28; lands the data and the grouping rule every later item reads |
| H | CT-31 | `src/project-page/project-tabs.ts`, `app/(app)/projects/[owner]/[name]/**`, `src/project-page/project-settings-section.tsx`, `src/project-page/project-group-select.tsx` | after CT-29 and CT-30; parallel with CT-32..CT-34 |
| I | CT-32 → CT-35 | CT-32: `src/projects/project-group-sections.tsx`, `app/(app)/projects/page.tsx`, `src/overview/**`, `src/projects/watched-repository-list.tsx`, the watched list's props in `app/(app)/settings/page.tsx`; CT-35: `app/(app)/scan-status/**`, `src/scan/**`, `app/(app)/packages/**`, `src/adapters/packages/**`, `src/adapters/deploy/**` | CT-32 after CT-30; CT-35 after CT-32 |
| J | CT-33 | `src/shell/app-sidebar.tsx`, `src/shell/app-shell.tsx`, `app/(app)/layout.tsx` | after CT-30; parallel with CT-31, CT-32, CT-34 |
| K | CT-34 | `src/broadcast/broadcast-form.tsx`, `src/broadcast/broadcast-form-state.ts`, `app/(app)/broadcast/page.tsx` | after CT-30; parallel with CT-31..CT-33 |
| F | CT-29 | `src/project-page/project-tabs.ts`, `tests/project-page/project-tabs.test.ts`, the project page e2e (`e2e/project-page.spec.ts`, and any spec that opens a project page without `?tab=` and expects another tab) | starts now, parallel with CT-26 (CT-26 does not touch these files) |
| L | CT-36 → CT-37 → CT-38 → CT-39 | CT-36: `modules/projects/migrations/0010_*`, `modules/projects/scheduled-tasks.ts`, the scheduled tasks part of `modules/projects/schema.ts`, `src/scheduled/**`, `app/(app)/scheduled/actions.ts`, `src/jobs/handlers.ts`, the queue lines of `softure.config.ts`; CT-37: `src/shell/navigation.ts`, the `ICONS` entry of `src/shell/app-sidebar.tsx`, `app/(app)/scheduled/page.tsx`, `src/scheduled/*-row*.tsx`, `e2e/scheduled.spec.ts`; CT-38: `src/shell/project-picker.tsx` (new), `src/broadcast/broadcast-form.tsx`, `src/scheduled/scheduled-task-dialog.tsx`; CT-39: `modules/projects/migrations/0011_*` and lane L's files | CT-36 starts now (no file shared with CT-31..CT-35); CT-37 after CT-33 (sidebar), CT-38 after CT-34 (picker) |

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. The routine row the owner pointed at** | CT-22 | 1 M |
| 2. The standard across the app | CT-23, CT-24 | 1 S, 1 M |
| 3. The standard comes from the package (F-3) | CT-25, CT-26, CT-27, CT-28 | 3 S, 1 M |
| 4. The project page opens where the decisions are (F-5) | CT-29 | 1 S |
| 5. Projects in the owner's groups (F-7) | CT-30, CT-31, CT-32, CT-33, CT-34, CT-35 | 2 M, 4 S |
| 6. Send later, by itself (F-8) | CT-36, CT-37, CT-38, CT-39 | 4 M |

**Shared files in slice 5.** `messages/en.ts` and `messages/pl.ts` take a block per item (each item adds its own keys,
never edits another's); `e2e/fixtures.ts` gets the two fictional owners in CT-30 and is only read afterwards. The second
of two parallel items to merge re-merges master.

**Layout rule for CT-30..CT-35 (binding).** A group is shown the same way everywhere: its name, then a muted count, then
its projects in the surface's existing row; groups in name order (the locale's collation), "No group"
last and only when it has projects, an empty group never shown. Every surface takes its sections from CT-30's
`groupProjects` and, for lists, renders them with CT-32's `ProjectGroupSections`; the sidebar uses the theme's
`SidebarGroup`, the picker the theme's `FieldSet`. No row changes its content; no screen ends up less tidy than
today's screenshot.

**Layout rule for CT-37..CT-39 (binding).** The Scheduled tasks page is built like the Broadcast page: `PageLayout`,
`PageTabs` with counts in the address, theme rows only (`ListEntry` with the identity on the left and the right column
of state on line 1 and the one "More actions" button on line 2), deletes in the shared confirm dialog, times in the
app's time zone. Creating and editing happen in one theme `Dialog`, never on a separate page; the project picker is
the same grouped picker as Broadcast's (one shared component). No screen may end up less tidy than Broadcast's.

The backlog entry `context/backlog/rows-on-theme-list-entry.md` (moving the local rows onto the theme) became CT-26 and
CT-28 on the owner's order F-3.

**Layout rule for CT-25..CT-28 (binding).** The package component replaces the local one at the same place, with the
same content: identity on the left (title, muted detail lines), the right column with the state on line 1 and the
controls on line 2 (one inline control, then the "More actions" button), the arrow beside the column on a row that
opens something, the right column wrapping under the identity below `md` with 44 px controls. Where the package draws
a detail differently (its chevron arrow instead of the app's arrow, its hover on every row, a `FoldRow` column that
falls under the summary on a phone), the package's look is the standard and the app adds no override. No screen may
end up less tidy than its CT-24 screenshot: same column edges, no wrap, overlap or row of uneven height that was not
there before.

## Items

### CT-22: A tidy routine row and the shared row menu
- **Change ID:** `routine-row-tidy`
- **Status:** done_code (2026-11-25; waiting: release)
- **Outcome:** a routine row on a project's Routines tab shows, in its right column, one last-call badge on top (result
  and time, for example "HTTP 200 · 21:04", red on an error) and under it the on/off switch with its label and one
  "More actions" button that opens a menu with Test, Replace token and Delete (Delete last, in the danger tone, still
  asking in the shared confirmation dialog); the separate state icon and the duplicate "last call" detail line are
  gone. The menu is the shared `RowActionsMenu`, and `ListRow`'s doc comment states the two rules: at most one inline
  control, the rest in the menu; each fact said once.
- **Prerequisites:** —
- **Touches (estimate):** `src/shell/row-actions-menu.tsx` (new, on theme-notion's `DropdownMenu`),
  `src/shell/list-row.tsx` (doc comment), `src/shell/confirm-delete-button.tsx` (opened from a menu item),
  `src/routines/routines-section.tsx`, `src/routines/routine-forms.tsx` (Test and Replace token started from a menu
  item), `messages/en.ts` and `messages/pl.ts` (own keys), `tests/shell/**`, the Routines e2e spec.
- **Size:** M
- **Unknowns:**
  - How Test reports its result once it runs from a menu item: the last-call badge refreshes and the result is
    announced (today's `Result` is hidden and announced); recommended: keep that, no toast. (owner: research; blocks: no)
  - Whether a dialog opened from a `DropdownMenu` item keeps focus right (Radix needs the menu closed first or a
    controlled dialog). (owner: research; blocks: no)
- **Risk:** the Routines e2e specs click Test, Replace token and Delete directly; they must open the menu first, and
  their `data-*` selectors stay.
- **Baseline:** today the row shows the enabled state three times and four loose controls on a wrapped line (F-1
  screenshot); after: a unit test pins `RowActionsMenu` (items, keyboard, destructive last) and the e2e at 1280 and
  390 px finds one badge, the switch and the menu button on one line in the right column, and the three actions in
  the menu.
- **Layout:** the row has two columns, top-aligned. Left: the name with its kind tag, one muted line under it
  (provider · target · token …1234). Right, right-aligned, two lines and never more at 1280 px: line 1 the last-call
  badge alone ("HTTP 200 · 21:04", or "Never called" in grey); line 2 the switch with its label, then the "More
  actions" icon button (the menu: Test, Replace token, a separator, Delete in red). Nothing else in the row: no state
  icon, no second check, no loose buttons. At 390 px the right column wraps under the left as one block, the same two
  lines, controls 44 px. Every routine row has the same height and the same column edges.
- **Verification:** unit tests for `RowActionsMenu` (renders its items, opens with Enter and arrow keys, Delete last
  and opens the confirmation dialog, Escape closes) and for the routine row (one badge, no state icon, switch and menu
  on one line); e2e on the Routines tab: add a routine, switch it off and on, Test from the menu and see the badge
  change, Replace token from the menu, Delete from the menu with confirm and cancel, all at 1280 and 390 px, with the
  bounding boxes asserting the badge and the controls line sit in the right column on two lines. Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-1, F-2
- **Input:** context/archive/2026-11-25-routine-row-tidy/change.md

### CT-23: Every row with several controls uses the row menu
- **Change ID:** `row-actions-menu-everywhere`
- **Status:** done_code (2026-11-25; waiting: release)
- **Outcome:** every list row in COCKPIT with more than one control shows at most one inline control (the one the row
  is mostly used for) and the rest in CT-22's `RowActionsMenu`; today that is the Broadcast detail's project rows
  (Issue link, Retry fire, Retry send); a row with a single action keeps it inline.
- **Prerequisites:** CT-22
- **Touches (estimate):** `app/(app)/broadcast/[id]/page.tsx`, `src/broadcast/**`, `src/routines/wake-chip.tsx`
  (`RetryWakeForm` started from a menu item, read-only use of CT-22's pattern), the Broadcast e2e spec.
- **Size:** S
- **Unknowns:**
  - Which control stays inline on a Broadcast project row: recommended Retry send when the send failed, otherwise
    the Issue link. (owner: research; blocks: no)
- **Risk:** `wake-chip.tsx` is also used by the inbox (CT-24's lane): only CT-23 edits it; CT-24 reads it.
- **Baseline:** today a Broadcast project row can show three loose buttons; after: a grep of `actions={[` with more
  than one control outside `RowActionsMenu` finds none, and the Broadcast e2e passes at 1280 and 390 px.
- **Layout:** the same right column as CT-22: state on line 1, then one inline control and the "More actions" button
  on line 2; a row with one action keeps only that action on line 2, no menu.
- **Verification:** a unit test that a row with two or more controls renders one inline control plus the menu; e2e on
  the Broadcast detail opening the menu and running each action (Issue, Retry fire, Retry send) at 1280 and 390 px.
  Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-2
- **Input:** context/archive/2026-11-25-row-actions-menu-everywhere/change.md

### CT-24: Every row says each fact once
- **Change ID:** `row-facts-said-once`
- **Status:** done_code (2026-11-25; waiting: release)
- **Outcome:** no list row in COCKPIT shows the same fact twice (a state icon beside a badge saying the same, a badge
  repeating a detail line) or puts plain information in its controls slot; the inbox's answered rows and history move
  "answered by" into the row's details, and the held packages move "no issue" into the details; every other list
  (overview, project page, history tab, deploys, packages, Team, Settings, Scan status) is audited and fixed where it
  repeats itself.
- **Prerequisites:** CT-22
- **Touches (estimate):** `src/inbox/inbox-row.tsx`, `app/(app)/inbox/page.tsx`, `src/adapters/packages/packages-details.tsx`,
  and, where the audit finds a repeat, `src/overview/**`, `src/project-page/**`, `src/adapters/deploy/**`,
  `src/team/**`, `src/projects/**`, `app/(app)/scan-status/**`; related e2e specs.
- **Size:** M
- **Unknowns:**
  - The audit's full list of repeats beyond the two known ones (owner: research; blocks: no)
- **Risk:** the inbox is the densest screen; moving text out of the right column must not hide the answer form
  (`data-row-wide`).
- **Baseline:** today the inbox and held packages put text in the controls slot and the routine row repeats its
  state (fixed by CT-22); after: the change lists every list audited with its verdict, and an e2e per touched screen
  checks the right column holds only badges and controls, at 1280 and 390 px.
- **Layout:** the right column holds only state (badges) on line 1 and controls on line 2; who answered, issue
  references as text and times move to the muted line under the title on the left.
- **Verification:** for every list audited, the change records the verdict (clean, or what moved); an e2e per touched
  screen asserts the right column contains only badges and controls (no plain text spans), at 1280 and 390 px; a unit
  test per moved fact asserts it appears once in the row. Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-2
- **Input:** context/archive/2026-11-25-row-facts-said-once/change.md

### CT-25: Roadmap item rows on the theme's FoldRow column
- **Change ID:** `fold-rows-on-theme-status`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** an item row of the roadmap view (a project's Roadmap tab, the promote control included) is theme-notion's
  `FoldRow` with its `status` (the status pill and the owner-step tag) and `actions` (the promote control) in the
  row's right column, lit with the bar as one box; the local `StatusActionFoldRow` (CT-11) and its inert placeholder
  copy of the action are deleted.
- **Prerequisites:** —
- **Touches (estimate):** `src/roadmap/roadmap-view.tsx`, `src/shell/status-action-fold-row.tsx` (deleted), the unit
  tests of the roadmap view, `e2e/project-page.spec.ts`, `e2e/promote.spec.ts`.
- **Size:** S
- **Unknowns:**
  - Whether the item's `id` anchor (`#item-CT-1`, `scroll-mt-16`) and its `data-item`/`data-status` attributes can stay
    on a wrapping `li` around `FoldRow` (they should; `FoldRow` renders inside it). (owner: research; blocks: no)
- **Risk:** `FoldRow` with a column puts the opened content beside the `<details>` (0.32.0), so selectors that look
  for `fold-row-content` inside `details` must look in `fold-row-with-actions`; find-in-page no longer opens a closed
  row.
- **Baseline:** today `StatusActionFoldRow` lays the action over an inert copy; after: no file in `src/` imports it,
  and the roadmap e2e passes at 1280 and 390 px.
- **Layout:** the bar: chevron and the item's title and facts on the left; on the right, the status pill (and the
  owner-step tag) on line 1 and the promote control on line 2, right-aligned, the column as tall as the bar and lit
  with it on hover and while open. Below `md` the column falls under the summary, controls 44 px. The opened content
  (details table, notes) starts at the chevron's x (the theme's 8 px inset). Every item row in a status group has the
  same column edge.
- **Verification:** a unit test that an item row renders `[data-slot=fold-row-status]` with the pill and
  `[data-slot=fold-row-action-list]` with the promote control, and none of the old `data-row-bar`/`data-action-place`
  markup; e2e on the Roadmap tab: open and close an item, follow an `#item-…` link, promote an item, at 1280 and
  390 px, asserting by bounding box that the pill and the control sit in the right column (1280) and under the summary
  (390). Screenshots of the Roadmap tab at 1280 and 390 px, light and dark, before and after, saved with
  `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap
  or misalignment before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-2, F-3
- **Input:** context/archive/2026-11-26-fold-rows-on-theme-status/change.md

### CT-26: Every list row on the theme's ListEntry
- **Change ID:** `list-rows-on-theme-list-entry`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** every list row in COCKPIT (overview, inbox and answered earlier, broadcast list and detail, project
  page, history tab, routines and their fired issues, Settings repositories, Team, Scan status, deploys, packages) is
  theme-notion's `ListEntry` inside the theme's `ListItem`; a row's existing "More actions" menu moves into
  `ListEntry`'s `menu` slot; the local `ListRow` (CT-18) is deleted and the row rules from its doc comment are the
  theme's documented rules.
- **Prerequisites:** —
- **Touches (estimate):** every `ListRow` caller (`src/overview/overview-row.tsx`, `src/inbox/inbox-row.tsx`,
  `src/inbox/answered-earlier-row.tsx`, `src/broadcast/send-row.tsx`, `src/broadcast/send-controls.ts`,
  `src/broadcast/send-row-menu.tsx`, `app/(app)/broadcast/page.tsx`, `src/project-page/project-page-sections.tsx`,
  `src/project-page/history/history-sections.tsx`, `src/routines/routines-section.tsx`, `src/routines/routine-forms.tsx`,
  `src/routines/fired-issue-row.tsx`, `src/projects/watched-repository-list.tsx`, `src/team/member-list.tsx`,
  `src/scan/scan-project-row.tsx`, `src/adapters/packages/packages-details.tsx`, `src/adapters/deploy/deploys-list.tsx`),
  `src/shell/list-row.tsx` (deleted), `src/shell/row-inset.ts` if nothing else uses it, the row helpers
  `e2e/expect-*.ts` and `tests/support/row-markup.ts`, the row unit tests and e2e specs that read `data-row-*`.
- **Size:** M
- **Unknowns:**
  - How a row's title aside (Team's email, a routine's kind tag) and an external link (history, fired issues) fit
    `ListEntry`'s props: recommended, the aside joins the `title` node and an external row passes a small app link
    component (`target="_blank" rel="noreferrer"`) as `linkComponent`, both inside the theme's API. (owner: research;
    blocks: no)
  - Whether every caller passes a `status`/`actions` list that may hold only nulls (the local row skipped those, the
    theme's `isDrawn` does not): recommended, callers pass `null` when the list is empty. (owner: research; blocks: no)
- **Risk:** the widest change of the roadmap (17 files, the shared e2e helpers); it runs alone in its lane so no other
  item edits these files meanwhile; the e2e helpers move from `data-row-*` to `data-slot="list-entry-*"` in one go.
  Each row's own `data-*` attributes (`data-entry`, `data-send-row`, …) stay on the row, so the specs keep finding it.
- **Baseline:** today 14 screens render the local `ListRow`; after: no file imports `src/shell/list-row.tsx` (it is
  gone), a test asserts every row on each list screen is `[data-slot=list-entry]`, and the full e2e passes.
- **Layout:** the binding layout rule above, screen by screen: what the left side, line 1 and line 2 of the right
  column hold today stays where it is; the routine row keeps the switch and the "More actions" button on one line
  (the button now in the `menu` slot); the inbox's answer form still takes the full row width (`data-row-wide`).
- **Verification:** unit tests for each migrated row's markup (identity, status, actions, menu slot, link) updated to
  the theme's slots; one test that each list screen's rows are `ListEntry`; the full e2e suite green at 1280 and
  390 px, with the bounding-box checks of `expect-side-holds-state-and-controls.ts` rewritten on the theme's slots;
  touch-target checks (44 px) on a phone for the switch, the inline control and the menu button. Screenshots of every
  list screen (overview, inbox, broadcast list and detail, project page, history, routines, Settings, Team, Scan
  status, deploys, packages) at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each pair itself and fixes any wrap, overlap or misalignment
  before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-2, F-3
- **Input:** context/archive/2026-11-26-list-rows-on-theme-list-entry/change.md

### CT-27: Every row menu on the theme's RowActionsMenu
- **Change ID:** `row-menus-on-theme-row-actions-menu`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** the routine row's menu (Test, Replace token, Delete) and the Broadcast project row's menu (Open issue,
  Retry the fire, Retry the send) are theme-notion's `RowActionsMenu` in `ListEntry`'s `menu` slot; Delete is its
  `destructiveAction` with `confirm` (the routine's question, hint, Delete and Cancel words; the dialog stays open and
  disabled while the delete runs, as today); the local `RowActionsMenu`, `useRowMenuFocus` and, if nothing else uses
  it, `ConfirmDeleteDialog` are deleted.
- **Prerequisites:** CT-26; a theme-notion release that closes SOFTURE/AI#1492 (async confirm, focus to an app
  dialog, touch-size items, item hooks). The item's first phase bumps `@softure-ai/theme-notion` to that release when
  the nightly bump has not yet done so.
- **Touches (estimate):** `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`,
  `src/shell/row-actions-menu.tsx` (deleted), `src/shell/confirm-delete-button.tsx`, `package.json` and
  `package-lock.json` (the bump), `tests/shell/row-actions-menu.test.tsx` (deleted or moved to the callers),
  `e2e/routines.spec.ts`, `e2e/broadcast.spec.ts`, `e2e/expect-routine-row.ts`, `e2e/expect-send-row.ts`.
- **Size:** S
- **Unknowns:**
  - The final API of the fix (names of the pending label, the focus hook and the item id): read from the theme's
    CHANGELOG at the bumped version. (owner: research; blocks: no)
- **Risk:** the menu's focus order with the Replace token dialog (CT-22's unknown) regresses; the e2e checks focus
  returns to the "More actions" button after each dialog closes.
- **Baseline:** today two callers use the local menu; after: no file imports `src/shell/row-actions-menu.tsx` (it is
  gone) and the routines and broadcast e2e pass.
- **Layout:** unchanged from CT-22/CT-23: one inline control, then the "More actions" icon button on the same line;
  the menu lists the regular actions, a separator, then Delete in the danger tone; menu items 44 px on a phone.
- **Verification:** unit tests per caller (the items in order, Delete last and destructive, a disabled item while its
  action runs); e2e on the Routines tab (Test, Replace token with focus back on the menu button, Delete with Cancel
  then confirm, the dialog disabled while deleting) and the Broadcast detail (each menu action), at 1280 and 390 px,
  with 44 px items on a phone. Screenshots of the routine row, its open menu and the delete dialog, and the Broadcast
  row and its open menu, at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the merge;
  master CI green after it.
- **PRD refs:** F-2, F-3
- **Input:** context/archive/2026-11-26-row-menus-on-theme-row-actions-menu/change.md

### CT-28: Every result badge on the theme's ResultBadge
- **Change ID:** `result-badges-on-theme-result-badge`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** every result badge in COCKPIT (doctor, access, read, last call, fired issue, wake, drift, answer state,
  broadcast send, packages, deploys, health) is theme-notion's `ResultBadge` with the same tone, icon override, word,
  hover title and its own `data-*` attribute; the local `ResultBadge` and `getResultColor` are deleted (the colour
  comes from the theme's `TONE_COLORS`).
- **Prerequisites:** CT-26; a theme-notion release that closes SOFTURE/AI#1493 (`data-*` passed through). The item's
  first phase bumps `@softure-ai/theme-notion` to that release when the nightly bump has not yet done so.
- **Touches (estimate):** `src/shell/result-badge.tsx` (deleted), `src/status/state-colors.ts`, the badge callers
  (`src/overview/overview-row.tsx`, `src/projects/repository-status.tsx`, `src/project-page/history/history-sections.tsx`,
  `src/routines/routines-section.tsx`, `src/routines/fired-issue-row.tsx`, `src/routines/wake-chip.tsx`,
  `src/drift/drift-flags.tsx`, `src/scan/read-status.tsx`, `src/inbox/answer-state-badge.tsx`,
  `src/broadcast/send-status.tsx`, `src/adapters/packages/packages-details.tsx`, `src/adapters/deploy/deploys-list.tsx`,
  `src/adapters/deploy/deploy-details.tsx`, `src/adapters/observability/health-chip.tsx`), `package.json` and
  `package-lock.json` (the bump), tests and e2e that read `data-result`/`data-tone`.
- **Size:** S
- **Unknowns:**
  - The muted tone's icon: the theme draws `CircleMinus` where the app drew `CircleDashed`; recommended, take the
    theme's (one standard). (owner: research; blocks: no)
- **Risk:** the local badge's `data-tone` named the colour and `data-result` the tone; the theme's `data-tone` names
  the tone and `data-color` the colour; every test and e2e reading them moves in this change.
- **Baseline:** today 15 files use the local badge; after: no file imports `src/shell/result-badge.tsx` (it is gone),
  and every `[data-slot=result-badge]` on the list screens carries its screen's `data-*` attribute.
- **Layout:** each badge where it is today (line 1 of a row's right column, or the chip it is); a long word truncates
  inside the badge with the full word on hover, never widening the column.
- **Verification:** unit tests per badge caller (tone, word, icon override, the `data-*` attribute, the spinning
  answer state); e2e on overview, inbox, routines, broadcast, history, deploys and packages reading the badges by
  `data-slot`, `data-tone` and their own attribute, at 1280 and 390 px. Screenshots of those screens at 1280 and
  390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run
  looks at each one itself before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-2, F-3
- **Input:** context/archive/2026-11-26-result-badges-on-theme-result-badge/change.md

### CT-29: A project's page always opens on Waiting
- **Change ID:** `project-page-opens-on-waiting`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** opening a project's page without a `tab` in the address (from the overview, the sidebar, a mail or an
  MCP link) always shows the Waiting tab ("Czeka"), whether or not the project has entries, roadmaps, changes,
  routines or a Production tab; a `?tab=` naming an available tab still opens that tab, and an unknown or unavailable
  one falls back to Waiting.
- **Prerequisites:** —
- **Touches (estimate):** `src/project-page/project-tabs.ts` (the fallback: today `tabs.find(hasContent)`, where
  Production always counts as content, so every project that reports health or a deploy opens on Production; and the
  doc comment), `tests/project-page/project-tabs.test.ts` (the case "opens the first tab with something in it"
  becomes "opens Waiting"), `e2e/project-page.spec.ts` and any e2e that relies on the old default.
- **Size:** S
- **Unknowns:** none (root cause read in the code above).
- **Risk:** e2e specs that open a project page without `?tab=` and expect Roadmaps, Changes or Production; each moves
  to an explicit `?tab=` or a click on the tab.
- **Baseline:** today a project with production data opens on Production (owner's screenshot, F-5) and one with only
  roadmaps or changes opens on Roadmaps or Changes; after: every project opens on Waiting.
- **Layout:** unchanged except which tab is current: the tab bar (Czeka, Roadmapy, Zmiany, Rutyny, Produkcja) with
  Czeka underlined as current and its panel below; with no entries the panel shows the Waiting empty state, not
  another tab's content. The address keeps no `?tab=` until a tab is clicked.
- **Verification:** unit tests for `buildProjectTabs`: no `requested` gives `waiting` for each combination (no data;
  entries only; roadmaps only; changes only; routines only; production only; everything at once, `waiting` with 0
  entries included); `requested` of each available tab gives that tab; `requested: "production"` without production
  and an unknown key give `waiting`. e2e: open, without `?tab=`, a project with production data and no entries, one
  with roadmaps and changes but no entries, and one with entries, and assert `Czeka` is the current tab
  (`aria-current="page"`) and the Waiting panel is shown, at 1280 and 390 px; then `?tab=production` opens
  Production. Screenshots of the project page opened without `?tab=` (production project) at 1280 and 390 px, light
  and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each
  one itself before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-5
- **Input:** context/archive/2026-11-26-project-page-opens-on-waiting/change.md

### CT-30: Project groups defined in Settings
- **Change ID:** `project-groups-in-settings`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** Settings has a "Project groups" section where the owner adds, renames and deletes groups; every watched
  project belongs to at most one group (or to none); the existing projects start in one group per forge owner (a group
  named after the account or organization, which the owner renames); a repository added later joins the group whose
  "new projects from" owner matches its own; a deleted group's projects fall to "No group". The pure
  `groupProjects` helper that every grouped surface uses (CT-32..CT-35) lands here.
- **Prerequisites:** CT-27, CT-28 (the group row uses the theme's `RowActionsMenu` and `ResultBadge`, not the local
  copies they delete).
- **Touches (estimate):** `modules/projects/migrations/0009_create_project_groups.sql` (new),
  `modules/projects/schema.ts`, `modules/projects/groups.ts` (new: list, insert, rename, delete, set a repository's
  group; results as values), `modules/projects/queries.ts` (`WatchedRepository` gains `groupId`),
  `src/projects/load-repositories.ts`, `src/projects/add-repository.ts` (the default group on add),
  `src/projects/group-projects.ts` (new), `src/projects/load-project-groups.ts` (new),
  `src/projects/project-groups-section.tsx` (new), `src/projects/project-group-forms.tsx` (new: add form, rename
  dialog), `app/(app)/settings/page.tsx` (the new section only), `app/(app)/settings/actions.ts`, `messages/en.ts`,
  `messages/pl.ts` (a `projectGroups` block), tests under `tests/projects/**` and `tests/modules/**`,
  `e2e/project-groups.spec.ts` (new), `e2e/fixtures.ts` (watched repositories of two fictional owners).
- **Size:** M
- **Data:** `projects.project_groups` (`id` identity, `name` text 1..60 characters after trim, unique on
  `lower(name)`, `default_owner` text NULL, lower-case, unique, matching a forge account name, `created_at`);
  `projects.repositories.group_id` bigint NULL `REFERENCES project_groups(id) ON DELETE SET NULL`, indexed. The
  migration seeds one group per distinct owner in `repositories.full_name` (name as the forge writes it,
  `default_owner` its lower case) and assigns each repository to it, in the same migration. Rollback in the header:
  drop the column, drop the table, delete the migration row. The constraints are the first line (unique names, the
  foreign key); the server actions check them again only to name the field in the error.
- **Rules:**
  - `groupProjects(projects, groups, { collator })` returns `{ group: { id, name } | null; projects }[]`: groups
    ordered by name with the app's locale collator, projects inside a group in the caller's order, groups with no
    project left out, the `null` ("No group") section last and only when it has projects. Every grouped surface uses
    it; none sorts or groups on its own.
  - Adding, renaming and deleting a group and setting a project's group are server actions behind the signed-in check
    the repository actions use; input is narrowed with zod (name trimmed, 1..60; owner `^[a-z0-9-]{1,39}$` or empty).
  - A duplicate name or owner is a field error ("A group with this name already exists"), never a 500.
- **Unknowns:**
  - Whether the seed should skip an owner with a single repository: recommended, no (one rule, the owner merges groups
    by renaming and reassigning). (owner: research; blocks: no)
- **Risk:** the migration runs on production data at the next deploy; the run tests it the way the release check does
  (a database at the live tag's schema with rows of two owners, then master's migrations over it).
- **Baseline:** today no group exists and nothing reads one; after: every watched repository has a `group_id` after
  the migration, and Settings lists one group per owner with its project count.
- **Layout:** Settings, between "Repositories" and "Team", a `SectionCard` "Project groups" (`id`
  `project-groups-heading`, description "Groups order the projects list, the sidebar and the project pickers. Pick a
  project's group on its Settings tab."). Inside, top to bottom: the add form on one line from `md` (Name input, the
  optional "New projects from" input with field help "A forge account or organization; repositories of it added later
  join this group", then the Add button; stacked full width on a phone, controls 44 px), then a theme `List` of the
  groups, ordered as `groupProjects` orders them. A group row is a `ListEntry`: identity = the group's name, one muted
  detail line "N projects · new from: owner" (the second part only when set); right column = the row menu only
  (Rename, separator, Delete in the danger tone). Rename opens a dialog with both fields prefilled; Delete opens the
  confirm dialog "Delete the group X? Its N projects move to No group." No group rows: the empty line "No groups yet.
  Every project shows under No group."
- **Verification:** unit tests: `groupProjects` (no groups; every project grouped; some ungrouped, "No group" last;
  an empty group left out; the locale collation of a name that starts with an accented capital (it sorts with its base letter, before "Zeta"); the caller's order kept inside
  a group); the module functions against PGlite (insert, duplicate name and owner as values, rename, delete sets
  `group_id` null, set a repository's group, an unknown group id as a value); the migration seed (two owners, three
  repositories → two groups, every repository assigned, the case of the owner kept in the name); `addRepository`
  assigns the matching default group and leaves none when no owner matches; the server actions' validation. e2e
  (`e2e/project-groups.spec.ts`) at 1280 and 390 px: the seeded groups listed with counts; add a group; a duplicate
  name shows the field error; rename it; delete it with Cancel, then confirm, and its projects show under No group
  on the Projects page; focus returns to the row menu after each dialog. Screenshots of the Settings section (list,
  open row menu, rename dialog, delete dialog) at 1280 and 390 px, light and dark, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the
  merge; master CI green after it.
- **PRD refs:** F-7
- **Input:** context/archive/2026-11-26-project-groups-in-settings/change.md

### CT-31: A project's Settings tab picks its group
- **Change ID:** `project-settings-tab`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** every project's page has a last tab "Settings" ("Ustawienia") whose first setting is the project's
  group: a dropdown of the groups defined in Settings plus "No group"; picking one saves at once and the project moves
  to that group everywhere on the next render.
- **Prerequisites:** CT-29 (it owns `project-tabs.ts` now), CT-30.
- **Touches (estimate):** `src/project-page/project-tabs.ts` (the `settings` key, last, no counter, never the
  default), `tests/project-page/project-tabs.test.ts`, `app/(app)/projects/[owner]/[name]/page.tsx` (the panel),
  `src/project-page/project-settings-section.tsx` (new), `src/project-page/project-group-select.tsx` (new, client),
  `app/(app)/projects/[owner]/[name]/actions.ts` (new or extended: set the group), `messages/en.ts`,
  `messages/pl.ts`, `e2e/project-settings.spec.ts` (new).
- **Size:** S
- **Rules:** the tab is always shown and never picked as the default (Waiting stays the default, CT-29); `?tab=settings`
  opens it. The action checks the signed-in user, narrows the group id with zod and refuses a group that no longer
  exists with a field error. The select is the theme's `Select`, not a native one.
- **Unknowns:** none.
- **Risk:** the e2e specs that count the project page's tabs; each reads the tab by name instead.
- **Baseline:** today the tab bar is Czeka, Roadmapy, Zmiany, Rutyny, Produkcja; after: the same plus Ustawienia
  last, and a project's group can be changed without leaving its page.
- **Layout:** the tab bar ends with "Ustawienia" (no counter). The panel is one `SectionCard` "Group" holding one
  settings row (the shared `SettingsRow` Settings uses): title "Group" with field help, hint "Decides the section this
  project shows in on the projects list, in the sidebar and in project pickers.", control on the right from `md` (the
  theme `Select`, 16 rem wide, 28 px tall from `md`, 44 px and full width under the hint on a phone). Options: the
  groups in `groupProjects` order, a separator, "No group"; the current one selected. While saving the select is
  disabled; after it the row's hint ends with a muted "Saved" announced through `aria-live="polite"`; a failure shows
  a `FieldError` under the select and the select goes back to the stored value. Under the row a link "Manage groups"
  to `/settings#project-groups-heading`. With no group defined the select holds only "No group" and the link reads
  "Add groups in Settings".
- **Verification:** unit tests: `buildProjectTabs` gives `settings` as the last tab, never as the default with or
  without data, and for `requested: "settings"`; the select's options and order; the action (signed-in check, unknown
  group as a value, `null` for No group). e2e at 1280 and 390 px: open `?tab=settings`, pick another group, see
  "Saved", open the Projects page and find the project under that group; pick No group and find it under No group;
  the select is 44 px on a phone. Screenshots of the tab (closed and open select) at 1280 and 390 px, light and dark,
  saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself before READY.
  All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-7
- **Input:** context/archive/2026-11-26-project-settings-tab/change.md

### CT-32: The projects list grouped, with the shared group sections
- **Change ID:** `grouped-project-lists`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** the Projects page shows one section per project group (No group last) instead of one per status, rows
  inside a group ordered by status (as `PROJECT_STATUSES` orders them) then by name, each row keeping its status
  badge; the Settings list of watched repositories is grouped the same way; both through one shared
  `ProjectGroupSections` component that CT-35 applies to the remaining project lists.
- **Prerequisites:** CT-30.
- **Touches (estimate):** `src/projects/project-group-sections.tsx` (new), `app/(app)/projects/page.tsx`,
  `src/overview/build-overview.ts` (the rows in group order, the status groups dropped where nothing else reads them),
  `src/projects/watched-repository-list.tsx`, `app/(app)/settings/page.tsx` (passes the groups to the watched list
  only), `messages/en.ts`, `messages/pl.ts`, tests under `tests/overview/**` and `tests/projects/**`,
  `e2e/overview.spec.ts`, `e2e/settings.spec.ts`.
- **Size:** M
- **Rules:** `ProjectGroupSections` takes the sections from `groupProjects`, a label for the list and a render
  function for a row; it owns the heading, the count and the spacing, so no screen draws its own group heading.
- **Unknowns:**
  - Whether the overview's status sections survive somewhere (the inbox counts or the digest read them): research
    reads every caller of `overview.groups`; recommended, keep the data for the digest and drop only the page's use.
    (owner: research; blocks: no)
- **Risk:** the overview e2e and the digest read the status groups; each moves to the new order or keeps reading the
  data it needs.
- **Baseline:** today the Projects page has one section per status ("Needs a decision", "Broken"…); after: one per
  project group, and the status shows only on each row (CT-24: a fact once).
- **Layout:** each section is a `section` with `aria-label` "Group: X" and an `h2` in `text-ui font-semibold` holding
  the group's name and, after it, the project count in `text-small text-muted-foreground` (the heading the status
  sections use today, with the name instead of the status badge); 24 px between sections, 4 px between the heading
  and its `List` (`density="roomy"`, a top and bottom border, as today). Rows are unchanged (`OverviewRow`,
  `ListEntry`). The "Last scan" line stays above the first section. The Settings watched list uses the same sections
  inside its card. No section for an empty group; "No group" last.
- **Verification:** unit tests: `ProjectGroupSections` (headings, counts, order, No group last, nothing for an empty
  list); the overview rows' order inside a group (status order, then name). e2e at 1280 and 390 px with fixtures of
  two groups and one ungrouped project: the Projects page shows the sections in order with their counts, every row
  its status badge, No group last; the Settings watched list matches; after CT-31 exists, moving a project moves its
  row. Screenshots of the Projects page and the Settings watched list at 1280 and 390 px, light and dark, before and
  after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself before
  READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-7, F-2
- **Input:** context/archive/2026-11-26-grouped-project-lists/change.md

### CT-33: The sidebar's projects grouped
- **Change ID:** `grouped-sidebar`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** the sidebar's project links show under one label per project group (No group last) instead of one
  "Projects" list, each link keeping its status icon and its active state.
- **Prerequisites:** CT-30.
- **Touches (estimate):** `src/shell/app-sidebar.tsx`, `src/shell/app-shell.tsx` (the prop's type), `app/(app)/layout.tsx`
  (the sections from `groupProjects`), `messages/en.ts`, `messages/pl.ts`, `tests/shell/**`, `e2e/` (a sidebar spec,
  new or in `overview.spec.ts`).
- **Size:** S
- **Rules:** the sidebar takes the sections from `groupProjects`; it does not group or sort on its own.
- **Unknowns:** none.
- **Risk:** the offcanvas sidebar on a phone grows taller; the group labels must not push the account footer off a
  390 × 844 screen without scrolling inside the sidebar.
- **Baseline:** today one `SidebarGroup` labelled "Projects" lists every project; after: one `SidebarGroup` per
  project group, labelled with the group's name.
- **Layout:** after the navigation group, one theme `SidebarGroup` per section: `SidebarGroupLabel` = the group's name
  (the theme's label style, truncated with the full name on hover), then its `SidebarMenu` (`aria-label` the group's
  name) of links as today (status icon, truncated name, 44 px on a phone, the row height from `md`). The last
  section is "No group" when it has projects. With no projects at all, the single "Projects" label and its empty
  line stay as today.
- **Verification:** unit tests of the sidebar: labels in order, links under their group, No group last, the empty
  state. e2e at 1280 and 390 px (the sheet opened on a phone): labels and links in order, the active link marked
  `aria-current="page"`, links 44 px on a phone. Screenshots of the sidebar at 1280 and 390 px (sheet open), light and
  dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one
  itself before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-7, F-2
- **Input:** context/archive/2026-11-26-grouped-sidebar/change.md

### CT-34: The Broadcast project picker grouped
- **Change ID:** `grouped-broadcast-picker`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** the Broadcast form's "Projects" picker shows one fieldset per project group (No group last), each with a
  checkbox that selects or clears the whole group; "Select all", "Clear all" and "Selected: N of M" keep working
  across groups.
- **Prerequisites:** CT-30.
- **Touches (estimate):** `src/broadcast/broadcast-form.tsx`, `src/broadcast/broadcast-form-state.ts`,
  `app/(app)/broadcast/page.tsx` (the sections from `groupProjects`), `messages/en.ts`, `messages/pl.ts`,
  `tests/broadcast/**`, `e2e/broadcast.spec.ts`.
- **Size:** S
- **Rules:** the group checkbox is checked when every project of the group is selected, indeterminate when some are,
  clear when none; toggling it selects all or none of that group only. The picker takes the sections from
  `groupProjects`.
- **Unknowns:** none.
- **Risk:** the broadcast e2e picks projects by their labels; the group fieldsets must keep each checkbox's label.
- **Baseline:** today one grid of 12 checkboxes in no order a person can see (owner's screenshot, F-7); after: one
  grid per group under the group's name.
- **Layout:** the "Projects" field keeps its legend, help, the Select all / Clear all buttons and "Selected: N of M"
  on top. Below, one theme `FieldSet` per section with 16 px between them: its legend line holds the group checkbox
  (the theme `Checkbox`, labelled with the group's name, `text-ui font-semibold`) and a muted "x of y" for that group;
  under it the group's projects in the grid used today (1 column on a phone, 2 from `sm`, 3 from `lg`, 4 from `xl`,
  each label truncated with the full name on hover, 44 px rows on a phone). The submit hint and the Send button stay
  under the last group.
- **Verification:** unit tests of the form state: selecting a group selects its projects only, clearing it clears
  them, the tri-state for all, some and none, the totals across groups. e2e at 1280 and 390 px: groups in order with
  their projects; the group checkbox selects and clears its group; Select all / Clear all still cover every group;
  sending creates issues only in the selected projects. Screenshots of the picker (all selected, one group cleared,
  one partly selected) at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked
  from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the merge; master
  CI green after it.
- **PRD refs:** F-7, F-2
- **Input:** context/archive/2026-11-26-grouped-broadcast-picker/change.md

### CT-35: Every other project list grouped
- **Change ID:** `grouped-other-project-lists`
- **Status:** ready
- **Outcome:** the remaining screens that list one row per project (Scan status, Packages, Deploys) use CT-32's
  `ProjectGroupSections`, so every list of projects in COCKPIT is ordered the same way; an audit in research names
  each list of projects and its verdict.
- **Prerequisites:** CT-32.
- **Touches (estimate):** `app/(app)/scan-status/page.tsx`, `src/scan/**`, `app/(app)/packages/page.tsx`,
  `src/adapters/packages/packages-details.tsx`, `src/adapters/deploy/deploys-list.tsx`,
  `src/adapters/deploy/load-deploys.ts`, their tests and e2e (`scan.spec.ts`, `packages.spec.ts`, `deploys.spec.ts`).
- **Size:** S
- **Rules:** a list whose rows are not projects (inbox entries, history, roadmap items) stays as it is: each of its
  rows already names its project; the audit records that verdict per list.
- **Unknowns:** none.
- **Risk:** Deploys leaves out apps without a deploy workflow; a group whose projects all lack one gets no section.
- **Baseline:** today these three screens list projects in watch order; after: grouped like the Projects page.
- **Layout:** CT-32's sections inside each screen's existing card or list, rows unchanged; no section for an empty
  group, No group last.
- **Verification:** unit tests per screen (rows under their groups, an empty group left out). e2e at 1280 and 390 px on
  the three screens reading the section labels and their rows. Screenshots of the three screens at 1280 and 390 px,
  light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at
  each one itself before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-7, F-2
- **Input:** context/changes/grouped-other-project-lists/change.md

### CT-36: Scheduled tasks stored and fired on time
- **Change ID:** `scheduled-tasks-store-and-fire`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** COCKPIT stores scheduled tasks (a title, a prompt, a local date and time in the app's time zone, and the
  watched projects to send to) and, once a task's time has come, sends it exactly once as a broadcast: one cockpit
  issue per chosen project with the prompt as its body, each project's routines woken as for any broadcast (CT-10).
  The run is recorded on the task (planned time, sent time, the broadcast it became), so its per-project result and
  retries live on the existing Broadcast detail page. No screen yet: the server actions (create, update, delete, run
  now) and the worker queue.
- **Prerequisites:** —
- **Touches (estimate):** `modules/projects/migrations/0010_create_scheduled_tasks.sql` (new),
  `modules/projects/schema.ts`, `modules/projects/scheduled-tasks.ts` (new; queries and the conditional claim),
  `src/scheduled/**` (new: `save-scheduled-task.ts`, `delete-scheduled-task.ts`, `run-scheduled-task.ts`,
  `scheduled-task-queue.ts`, `scheduled-task-handler.ts`, `load-scheduled-tasks.ts`), `app/(app)/scheduled/actions.ts`
  (new), `src/jobs/handlers.ts`, `softure.config.ts` (queue and its `every: "1m"` schedule), `src/broadcast/send-broadcast.ts`
  (only if the send needs an extra input; its contract stays), `messages/en.ts` and `messages/pl.ts` (own block: error
  messages), `tests/scheduled/**`, `tests/modules/**`.
- **Size:** M
- **Rules:**
  - A task's time is entered as a `LocalDateTime` (`YYYY-MM-DDTHH:mm`) in `config.timezone` and stored as the instant
    from core's `getLocalDateTimeInstant`; a time not in the future (one minute of grace) is refused on create and edit.
  - Title and prompt use the broadcast limits (`src/broadcast/broadcast-limits.ts`); at least one project; every
    project must be watched at save time. A project unwatched later is skipped at fire time and named in the run.
  - Firing: the queue `cockpit.scheduled-tasks` runs every minute; it claims due tasks with one conditional `UPDATE`
    (`status = 'scheduled' AND run_at <= now`, `FOR UPDATE SKIP LOCKED`), so two workers or two ticks never fire a
    task twice; the send is `sendBroadcast` with the run's own broadcast id stored before sending, so a crashed or
    retried send never makes a second issue (the broadcast marker). A run still `sending` after `STALE_SEND_MS` is
    taken over by the next tick.
  - A task whose time passed while the worker was down fires on the next tick and records both times (planned and
    sent); nothing is dropped silently.
  - "Run now" sends a scheduled task at once through the same claim and send.
  - Only a `scheduled` task can be edited; delete removes a scheduled task, or a sent task's entry (the broadcast and
    its issues stay in Broadcast history).
  - Every action checks the signed-in member's authorization, not only a session; input is narrowed with zod.
- **Unknowns:**
  - Whether `sendBroadcast` can be called from the worker as is (it takes `db`, `client`, `clock`, `wake`); recommended:
    yes, through the same `getForgeClient` and `getWakeDependencies` the fire handler uses. (owner: research; blocks: no)
- **Risk:** a double fire would spend the owner's token budget twice; the claim and the broadcast id are the two
  guards and both are tested.
- **Baseline:** today a broadcast is sent only when the owner presses Send; after: a stored task sends itself at its
  time.
- **Layout:** no screen in this item.
- **Verification:** unit tests: validation (empty title or prompt, over-long, no projects, an unwatched project, a past
  time, the one-minute grace, a local time on a DST change day in Europe/Warsaw: 2026-03-29T02:30 refused or moved as
  core defines, 2026-10-25T02:30 the first instant). Integration tests on PGlite with a fake clock and a fake forge:
  a due task fires once and its issues carry the marker and the prompt; two concurrent ticks fire it once; a stale
  `sending` run is taken over without a second issue; a not-yet-due task is left alone; "Run now" fires once; edit of
  a sent task is refused; delete of a sent task keeps its broadcast; the routines of each project are woken (fake wake).
  e2e: the existing suites stay green (no screen yet). All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-8, NFR-5, NFR-7
- **Input:** context/archive/2026-11-26-scheduled-tasks-store-and-fire/change.md

### CT-37: The Scheduled tasks page in the sidebar
- **Change ID:** `scheduled-tasks-page`
- **Status:** done_code (2026-11-26; waiting: release)
- **Outcome:** the sidebar has a "Scheduled tasks" item (after Broadcast; Polish copy "Zaplanowane zadania" in `messages/pl.ts`) opening `/scheduled`,
  a page with two tabs, "Scheduled" (upcoming, soonest first) and "Done" (sent runs, newest first), each a list of
  the theme's `ListEntry` rows; a scheduled row's menu offers Run now and Delete (in the shared confirm dialog); a done
  row opens its broadcast's detail page.
- **Prerequisites:** CT-36, CT-33 (both edit `src/shell/app-sidebar.tsx`).
- **Touches (estimate):** `src/shell/navigation.ts`, `src/shell/app-sidebar.tsx` (the `ICONS` entry only:
  `CalendarClock`), `app/(app)/scheduled/page.tsx` (new), `src/scheduled/scheduled-task-row.tsx` (new),
  `src/scheduled/scheduled-run-row.tsx` (new), `src/scheduled/scheduled-row-menu.tsx` (new, on the theme's
  `RowActionsMenu`), `messages/en.ts`, `messages/pl.ts` (own block), `tests/scheduled/**`, `e2e/scheduled.spec.ts` (new),
  `e2e/fixtures.ts` (fictional tasks, appended).
- **Size:** M
- **Rules:** the page follows the Broadcast page's standard: `PageLayout`, `PageTabs` with counts and `?tab=` in the
  address (`pickTab`), rows from the theme only (`ListEntry`, `RowActionsMenu`, `ResultBadge`), delete through the
  shared confirm dialog, times through `createTimeFormatter` in the app's time zone.
- **Unknowns:** none.
- **Risk:** the sidebar's phone sheet gains one item; the account footer must still fit 390 × 844 (CT-33's check).
- **Baseline:** today there is no way to send something later; after: the owner sees what will be sent when, and what
  was sent.
- **Layout:** the page header: title "Scheduled tasks", description one line ("A prompt that reaches the chosen projects as
  an issue at the chosen time"), and on the right of the header the primary "New task" button (added
  by CT-38; this item leaves the slot empty). Tabs "Scheduled (N)" and "Done (N)". A **scheduled row**
  (`ListEntry`): left the title (one line, truncated), under it one muted line "N projects · <first line of the prompt,
  truncated>"; right column line 1 the time badge ("Mon 30 Nov, 08:00" with a muted "in 3 days"), line 2 the "More
  actions" button (menu: Edit (from CT-38), Run now, separator, Delete in red). A **done row**: left the title and
  the muted line "N projects · planned Mon 30 Nov, 08:00"; right column line 1 one `ResultBadge` ("Sent 5 of 5"
  green, "Failed in 2 of 5" red, "Sending" grey), line 2 the sent time; the row opens `/broadcast/<id>` (arrow). Empty
  tab: the theme's `Empty` with one sentence ("Nothing is waiting. Add a task with New task."). Every row the
  same height and column edges; at 390 px the right column wraps under the left as one block, controls 44 px.
- **Verification:** unit tests: the navigation order (Scheduled after Broadcast), the row view models (relative time,
  "N projects", result badge tone per outcome), tab counts, sorting of both tabs. e2e at 1280 and 390 px with fixture
  tasks: the sidebar item opens the page and is marked `aria-current="page"`; both tabs list their rows in order;
  Run now from the menu moves the row to Done with the result badge; Delete from the menu with cancel and confirm;
  a done row opens its broadcast detail; the empty state. Screenshots of both tabs, the open row menu and the delete
  dialog at 1280 and 390 px, light and dark, saved with `softure-evidence` and linked from the plan's Progress; the
  run looks at each one itself and fixes any wrap, overlap or misalignment before READY. All CI jobs green before the
  merge; master CI green after it.
- **PRD refs:** F-8, F-2
- **Input:** context/archive/2026-11-26-scheduled-tasks-page/change.md

### CT-38: Create and edit a scheduled task in a dialog
- **Change ID:** `scheduled-task-dialog`
- **Status:** ready
- **Outcome:** "New task" on the Scheduled tasks page and "Edit" in a scheduled row's menu open one dialog with
  the title, the prompt, the date and time, and the project picker; saving closes the dialog and the row appears (or
  changes) in the Scheduled tab. The project picker is the Broadcast form's grouped picker, moved into the shared
  `ProjectPicker` and used by both forms.
- **Prerequisites:** CT-37, CT-34 (the grouped picker it reuses).
- **Touches (estimate):** `src/shell/project-picker.tsx` (new, extracted from `src/broadcast/broadcast-form.tsx`),
  `src/broadcast/broadcast-form.tsx` (uses it; no visible change), `src/scheduled/scheduled-task-dialog.tsx` (new),
  `src/scheduled/scheduled-task-form-state.ts` (new), `app/(app)/scheduled/page.tsx` (the header button and the
  Edit item), `messages/en.ts`, `messages/pl.ts` (own block), `tests/scheduled/**`, `tests/broadcast/**`,
  `e2e/scheduled.spec.ts`, `e2e/broadcast.spec.ts` (stays green).
- **Size:** M
- **Rules:** the dialog is the theme's `Dialog` with a server-action form (as the project group dialog of CT-30); the
  form keeps its values on a refused save and shows each error under its field; the date and time are the theme's
  `Input` with `type="date"` and `type="time"` (native pickers on a phone) until theme-notion ships a picker
  (SOFTURE/AI#1509), then the package component replaces them; the time zone is shown, never asked.
- **Unknowns:** none.
- **Risk:** extracting the picker touches the Broadcast form; its e2e and unit tests must pass unchanged.
- **Baseline:** after CT-37 tasks exist only as fixtures; after: the owner creates and edits them.
- **Layout:** the dialog, 640 px wide from `md`, full width with 16 px margins on a phone, scrolls inside on a short
  screen. Header: "New task" or "Edit task", one muted line ("At the chosen time every chosen project gets an
  issue with this prompt."). Fields top to bottom, 16 px apart, each the theme's `Field` with its label above: "Title"
  (one-line input, counter under it near the limit); "Prompt" (textarea, 8 rows, grows to 16, monospace off, counter);
  "When": the date and the time side by side (time 7 rem wide) on one line, then a muted "Europe/Warsaw · in 3 days"
  computed as you type, and two quick chips under it, "Tomorrow 08:00" and "Monday 08:00", that fill the fields;
  "Projects": the shared `ProjectPicker` (groups with their checkbox, Select all / Clear all, "Selected: N of M"), inside
  a bordered box that scrolls after 320 px. Footer, right-aligned: "Cancel" (secondary) and "Schedule" or "Save"
  (primary, a spinner while saving). On a phone the footer sticks to the dialog's bottom, buttons 44 px, full width,
  primary first.
- **Verification:** unit tests: the form state (defaults: tomorrow 08:00, nothing selected; chips; the relative-time
  hint; errors per field from the action's result); `ProjectPicker` (the CT-34 behaviour, now from the shared file).
  e2e at 1280 and 390 px: create a task with two projects for tomorrow 08:00 and see it in the Scheduled tab; a past
  time and an empty prompt show their errors and keep the values; Edit changes the time and the row follows; Cancel
  and Escape close without saving; the Broadcast form still sends. Screenshots of the empty dialog, the filled dialog,
  the dialog with errors and the edit dialog at 1280 and 390 px, light and dark, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the merge;
  master CI green after it.
- **PRD refs:** F-8, F-2
- **Input:** context/changes/scheduled-task-dialog/change.md

### CT-39: A scheduled task that repeats
- **Change ID:** `scheduled-task-repeat`
- **Status:** ready
- **Outcome:** the dialog's "Repeat" choice (No, Daily, Weekly) makes a task fire again at the same local
  time; after each run the task stays in the Scheduled tab with its next time, each run lands in Done, and a menu item
  pauses or resumes it.
- **Prerequisites:** CT-38.
- **Touches (estimate):** `modules/projects/migrations/0011_add_scheduled_task_repeat.sql` (new; `repeat`, `paused`),
  `modules/projects/scheduled-tasks.ts`, `src/scheduled/**`, `app/(app)/scheduled/**`, `messages/en.ts`, `messages/pl.ts`
  (own block), `tests/scheduled/**`, `e2e/scheduled.spec.ts`.
- **Size:** M
- **Rules:** the next time is the next local date-time after the run's planned time (not after "now") in the app's
  time zone, computed with core's local date-time helpers, so 08:00 stays 08:00 across a DST change; a run missed by
  more than one period fires once, not once per missed period; a paused task does not fire and shows "Paused".
- **Unknowns:** none.
- **Risk:** a wrong next time could fire twice in one period; the claim and a unique (task, planned time) run key guard it.
- **Baseline:** after CT-38 every task fires once; after: weekly and daily tasks.
- **Layout:** in the dialog, under "When", a `RadioGroup` in one row ("No", "Daily", "Weekly on <day>");
  a scheduled row's muted line gains "· weekly" and its time badge shows the next run; the menu gains "Pause"
  or "Resume" above the separator; a paused row's badge is grey "Paused".
- **Verification:** unit tests: the next time for daily and weekly across both 2026 DST changes in Europe/Warsaw, a
  missed period fires once, pause and resume. Integration test: a weekly task fires, gets its next time and fires
  again with the clock moved a week, one run each, one issue per project per run. e2e at 1280 and 390 px: create a
  weekly task, Run now, the row stays in Scheduled with the next time and the run shows in Done; pause and resume.
  Screenshots of the dialog with the repeat choice and of a repeating and a paused row at 1280 and 390 px, light and
  dark, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself before
  READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-8
- **Input:** context/changes/scheduled-task-repeat/change.md

## Owner decisions and checks

The owner steps below were carried over from it and stay in the owner queue until they are settled.

## Owner decisions and checks

- [ ] **CMP-12**: turn the digest on: in Resend verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY` and `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) and `DIGEST_RECIPIENTS` (`SOFTURE_EMAIL_KEY_SECRET` is already set), and the variables `MAIL_FROM` and optionally `DIGEST_AT`; after the following deploy the run checks the first digest and its unsubscribe link (README, "The digest in production"). Today these secrets are empty (deploy run 45375144586). (carried over from cockpit-v2)
- [ ] **CMP-20**: to invite teammates, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`; the invitation mail needs the digest's mail settings above (carried over from cockpit-v2)
- [ ] **CMP-18**: to publish the CLI, store a granular npm token (read and write on the `@softure-ai` scope) as `NPM_TOKEN` in the `npm` environment and give the word to publish `@softure-ai/cockpit` 0.7.0 (`publish-cli` has never run) (carried over from cockpit-v2)
- [ ] **CMP-21** (optional): to show health from observability, set the variable `GRAFANA_URL` and the secret `GRAFANA_TOKEN` (a Grafana service account that may read alert rules) in the `production` environment; today `GRAFANA_TOKEN` is empty (carried over from cockpit-v2)
- [ ] **CT-10**: before the release that carries CT-10, set the secret `ROUTINE_TOKEN_SECRET` (`openssl rand -base64 32`; never change it afterwards, or every stored routine token has to be pasted again) in the `production` environment; then, per project, set up its COCKPIT command routine (`routines/cockpit-command.md` of `@softure-ai/skills` 0.40), paste the fire URL and token on the project's Routines tab and press Test

## Done
- **CT-22** `routine-row-tidy`: a routine row shows one last-call badge with its time on top of the right column and the switch beside the shared `RowActionsMenu` (Test, Replace token, Delete last in red); `ConfirmDeleteDialog` split out; `ListRow` states the two row rules; SOFTURE/AI#1487 filed; waiting: release; archived in `archive/2026-11-25-routine-row-tidy/`
- **CT-23** `row-actions-menu-everywhere`: a Broadcast project row shows one inline control (Retry send, else the Issue link) and the shared `RowActionsMenu` with the rest (Open issue, Retry the fire, Retry the send); rule in `pickSendControls`; waiting: release; archived in `archive/2026-11-25-row-actions-menu-everywhere/`
- **CT-24** `row-facts-said-once`: answered and put-off entries name their issue and who answered under the entry, held packages their issue under the package; merges, releases and the last package update keep one badge with a bare time; Scan status says "Checked" under its "Read" badge; every list audited (verdicts in research.md); waiting: release; archived in `archive/2026-11-25-row-facts-said-once/`
- **CT-25** `fold-rows-on-theme-status`: roadmap item rows use theme-notion's `FoldRow` `status`/`actions` column (pill, owner-step tag, promote control), the local `StatusActionFoldRow` is deleted; waiting: release; archived in `archive/2026-11-26-fold-rows-on-theme-status/`
- **CT-29** `project-page-opens-on-waiting`: a project's page opened without `?tab=` always shows Waiting (production, roadmaps or changes no longer win the default); `?tab=` still opens an available tab; e2e `project-default-tab.spec.ts`; waiting: release; archived in `archive/2026-11-26-project-page-opens-on-waiting/`

## Decisions (auto)
- PRD readiness → proceed from feedback (`--from-feedback`), no PRD change (a visual standard, no new requirement)
- Baseline → the probes as read in this run, unconfirmed (autonomous mode)
- Framing → optimise for quality; first proof CT-22; main risk the breadth of the rollout (the owner's rule F-2)
- Split of the rollout → by concern (controls vs. facts), so the two items own disjoint files and run in parallel
- Theme 0.34 `ListEntry`/`ResultBadge` → deferred to the backlog: it lacks the row menu (SOFTURE/AI#1486, filed in
  this run) and a theme bump is the package-update routine's job
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos" → every item
  carries a Layout spec and a Verification line (unit, e2e, screenshots at 1280/390 light/dark)
- Prefix → `CT` continues (cockpit-v3 is archived; numbers stay stable)
- F-3 (2026-11-26) → added to cockpit-v4 as CT-25..CT-28 rather than a new roadmap: the owner wanted them in the same
  deploy; F-4 narrowed that release to CT-25 and CT-26, and F-6 widened it again to CT-25..CT-29 once the theme gaps shipped
- Split of F-3 → one item per package component, so each deletes its own local copy; CT-25 and CT-26 own disjoint
  files and start at once; CT-27 and CT-28 edit files CT-26 rewrites, so they follow it
- Package gaps → filed, not worked around (AGENTS.md "SOFTURE packages first"): SOFTURE/AI#1492 (`RowActionsMenu`),
  SOFTURE/AI#1493 (`ResultBadge`); CT-27 and CT-28 wait for them and bump the theme themselves once released
- F-5 (2026-11-26) → CT-29 in cockpit-v4: the default tab is always Waiting, replacing CT-5's "first tab with something
  in it"; a deep link with `?tab=` still wins
- F-7 (2026-11-26) → CT-30..CT-35 in cockpit-v4 (coordinator's note: the same release as CT-25..CT-29), not a new
  roadmap
- Split of F-7 → the data, the Settings section and the pure `groupProjects` rule first (CT-30); then one item per
  surface (project tab, lists, sidebar, picker) on disjoint files, so four threads run at once; the remaining project
  lists (CT-35) follow the shared list component of CT-32
- Default groups → generic, nothing named in the repository: the migration seeds one group per forge owner of the
  watched repositories (the owner's personal account and organization come out as two groups by themselves) and a group's
  optional "new projects from" owner places later repositories; the owner renames and reassigns freely
- Group order → by name (the locale's collation), no manual reordering (the simplest order that is stable); No group
  last
- Inbox, history and roadmap rows → not grouped: they are not project rows and each already names its project
  (CT-35's audit records it per list)
- CT-30 after CT-27 and CT-28 → the group rows use the theme's row menu and badge directly instead of the local copies
  those items delete
- Theme coverage → `Select`/`SelectGroup`, `FieldSet`, `Checkbox`, `SidebarGroup`/`SidebarGroupLabel`, `List` and
  `ListEntry` in theme-notion 0.37.0 cover every piece; no package gap found, no issue filed
- F-8 (2026-11-26) → CT-36..CT-39 appended to cockpit-v4 (the numbering and the release flow continue; the release
  order F-7 is not widened by this run: the owner's word decides whether they ride the same release)
- Scheduled task = a broadcast sent later, not a new kind of write: the same cockpit issue, marker, idempotency and
  routine wake (NFR-5, NFR-7), and the run's result and retries reuse the Broadcast detail page
- Firing → a table plus a one-minute schedule with a conditional claim, not one delayed job per task: tasks can be
  edited, deleted and listed, and a jobs delay is capped at a week
- Missed time (worker down) → fire on the next tick and show both times, never drop silently
- Split of F-8 → store and firing first (no screen, testable with a fake clock), then the page, then the dialog, then
  repetition; the sidebar item waits for CT-33 and the dialog for CT-34's grouped picker, which it moves into the shared
  `ProjectPicker`
- Date and time input → the theme's `Input` with native date and time pickers plus two quick chips (tomorrow 08:00,
  Monday 08:00); the missing theme date-time picker filed as SOFTURE/AI#1509, replaced once it ships
- Repetition (daily, weekly) → its own item CT-39: the owner's example (Monday after the allowance resets) recurs, but
  a one-off task already covers the first Monday
