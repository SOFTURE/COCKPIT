---
project: "COCKPIT"
roadmap: cockpit-v4
version: 3
status: ready
prd_version: 3
updated: 2026-11-26
---

# Roadmap cockpit-v4: a list row says each fact once and keeps its controls tidy

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: not ordered (no release, tag, publish or deploy without the owner's word); the owner's order of
>   2026-11-26 07:26Z (F-4): the next release waits for CT-25 and CT-26 only; CT-27 and CT-28 ride the release after it;
>   CT-29 (F-5, 2026-11-26 07:47Z) rides this release too
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
| **CT-26** | `list-rows-on-theme-list-entry` | every list row in COCKPIT is theme-notion's `ListEntry` (row menus in its `menu` slot); the local `ListRow` is deleted | — | autonomous | ready |
| **CT-27** | `row-menus-on-theme-row-actions-menu` | every row menu is theme-notion's `RowActionsMenu`; the local `RowActionsMenu` is deleted | CT-26 | autonomous | blocked (SOFTURE/AI#1492) |
| **CT-28** | `result-badges-on-theme-result-badge` | every result badge is theme-notion's `ResultBadge`; the local `ResultBadge` is deleted | CT-26 | autonomous | blocked (SOFTURE/AI#1493) |
| **CT-29** | `project-page-opens-on-waiting` | a project's page opens on its Waiting tab unless the address names another tab, whatever the project reports (production included) | — | autonomous | ready |

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

**Framing.** Optimising for: quality of the everyday screens (the owner reads them daily). First proof: CT-22, the
row the owner pointed at, which also builds the shared row menu. Main risk: the rollout touching many screens at
once; it is split by concern (controls in CT-23, facts in CT-24) so two threads run side by side on disjoint files.
Depth: the shared component and its rule in CT-22; the rollouts are mechanical.

**Why this order.** CT-22 lands the shared `RowActionsMenu` and the two rules in `src/shell/list-row.tsx`'s doc
comment, so CT-23 and CT-24 apply a finished standard instead of inventing one. CT-23 and CT-24 then run in parallel.

**Sizes:** S is one screen or a mechanical move of existing controls; M builds a shared component and applies it to
its first screen with tests.

### Starting point
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
| F | CT-29 | `src/project-page/project-tabs.ts`, `tests/project-page/project-tabs.test.ts`, the project page e2e (`e2e/project-page.spec.ts`, and any spec that opens a project page without `?tab=` and expects another tab) | starts now, parallel with CT-26 (CT-26 does not touch these files) |

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. The routine row the owner pointed at** | CT-22 | 1 M |
| 2. The standard across the app | CT-23, CT-24 | 1 S, 1 M |
| 3. The standard comes from the package (F-3) | CT-25, CT-26, CT-27, CT-28 | 3 S, 1 M |
| 4. The project page opens where the decisions are (F-5) | CT-29 | 1 S |

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
- **Status:** ready
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
- **Input:** context/changes/list-rows-on-theme-list-entry/change.md

### CT-27: Every row menu on the theme's RowActionsMenu
- **Change ID:** `row-menus-on-theme-row-actions-menu`
- **Status:** blocked (SOFTURE/AI#1492)
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
- **Input:** context/changes/row-menus-on-theme-row-actions-menu/change.md

### CT-28: Every result badge on the theme's ResultBadge
- **Change ID:** `result-badges-on-theme-result-badge`
- **Status:** blocked (SOFTURE/AI#1493)
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
- **Input:** context/changes/result-badges-on-theme-result-badge/change.md

### CT-29: A project's page always opens on Waiting
- **Change ID:** `project-page-opens-on-waiting`
- **Status:** ready
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
- **Input:** context/changes/project-page-opens-on-waiting/change.md

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
  deploy; F-4 narrows that release to CT-25 and CT-26, and CT-27 and CT-28 follow in the next one
- Split of F-3 → one item per package component, so each deletes its own local copy; CT-25 and CT-26 own disjoint
  files and start at once; CT-27 and CT-28 edit files CT-26 rewrites, so they follow it
- Package gaps → filed, not worked around (AGENTS.md "SOFTURE packages first"): SOFTURE/AI#1492 (`RowActionsMenu`),
  SOFTURE/AI#1493 (`ResultBadge`); CT-27 and CT-28 wait for them and bump the theme themselves once released
- F-5 (2026-11-26) → CT-29 in cockpit-v4: the default tab is always Waiting, replacing CT-5's "first tab with something
  in it"; a deep link with `?tab=` still wins
