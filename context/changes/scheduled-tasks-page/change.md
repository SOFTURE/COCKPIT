---
change_id: scheduled-tasks-page
title: "The Scheduled tasks page in the sidebar"
status: plan_reviewed
roadmap_item: CT-37
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The sidebar has a "Scheduled tasks" item (after Broadcast; Polish copy "Zaplanowane zadania" in `messages/pl.ts`) opening `/scheduled`, a page with two tabs, "Scheduled" (upcoming, soonest first) and "Done" (sent runs, newest first), each a list of the theme's `ListEntry` rows; a scheduled row's menu offers Run now and Delete (in the shared confirm dialog); a done row opens its broadcast's detail page.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-37: The Scheduled tasks page in the sidebar
- **Change ID:** `scheduled-tasks-page`
- **Status:** ready
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
- **Input:** context/changes/scheduled-tasks-page/change.md

Findings gathered while recording it (master b92aa7d):
- Owner, 2026-11-26 10:46Z (F-8, translated): scheduled tasks: set the date when a prompt fires as an issue in the
  chosen repositories (example: a code-quality check across chosen projects on Monday after the token allowance
  resets, run by itself); a separate tab in the left menu, by the app's existing standard (tabs, a dialog).
- `app/(app)/broadcast/page.tsx` is the standard to copy: `PageLayout`, `PageTabs` with `pickTab`/`tabHref`, theme `List`/`ListEntry`, the shared delete dialog.
- `src/shell/navigation.ts` lists the sidebar destinations; `src/shell/app-sidebar.tsx` maps each key to a lucide icon in `ICONS`.

## Constraints
- Owns (lane L): `src/shell/navigation.ts`, the `ICONS` entry of `src/shell/app-sidebar.tsx`, `app/(app)/scheduled/page.tsx`, `src/scheduled/*-row*.tsx`, `e2e/scheduled.spec.ts`.
- Starts once CT-36 and CT-33 are merged.
- The roadmap's binding layout rule for CT-37..CT-39 (section "Slices").
- Build on the `@softure-ai/*` packages (AGENTS.md "SOFTURE packages first"); a missing piece becomes an issue in
  SOFTURE/AI right away, never a local wrapper or override.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts` (each item adds its own block); on a phone controls are at least 44 px.
- COCKPIT's only write to watched repositories stays the cockpit issue (AGENTS.md "Access to watched repositories").
- Fixtures, screenshots and test data are fictional (AGENTS.md "Open source and generic").
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- Frame skipped: the owner's explicit feature, with the split recorded in the roadmap.
