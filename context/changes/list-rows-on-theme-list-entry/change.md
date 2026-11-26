---
change_id: list-rows-on-theme-list-entry
title: "Every list row on the theme's ListEntry"
status: new
roadmap_item: CT-26
created: 2026-11-26
updated: 2026-11-26
---

## Intent
Every list row in COCKPIT (overview, inbox and answered earlier, broadcast list and detail, project page, history tab, routines and their fired issues, Settings repositories, Team, Scan status, deploys, packages) is theme-notion's `ListEntry` inside the theme's `ListItem`; a row's existing "More actions" menu moves into `ListEntry`'s `menu` slot; the local `ListRow` (CT-18) is deleted and the row rules from its doc comment are the theme's documented rules.

## Context
The roadmap item (cockpit-v4), verbatim:

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

Findings gathered while recording it (theme-notion 0.35.0 from npm, master 8b630c2):
- Owner, 2026-11-26 07:15Z (translated, F-3): "the changes that are done in the Notion package: bump them and carry
  them out still before the deployment, so that the app is switched over to the newest package".
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos": the Layout and
  Verification lines above are binding.
- Package: `ListEntry` (0.34.0, SOFTURE/AI#1481; `menu` slot 0.35.0, SOFTURE/AI#1486) renders a `div`
  (`data-slot="list-entry"`) to place in the theme's `ListItem`; props `title`, `details`, `status`, `actions`, `menu`,
  `href`, `linkComponent`, and rest props on the `div` (so `data-*` pass through). Slots: `list-entry-identity`,
  `-title`, `-details`, `-side`, `-column`, `-status`, `-actions`, `-menu`, `-arrow` (a `ChevronRight`, also on a row
  that opens outside the app). `data-row-wide` works as in the local row.
- Not in the package, solved with its API (no gap): `titleAside` (part of the `title` node), `isExternal` (an app link
  component passed as `linkComponent`), the local row's `data` prop (rest props / the `ListItem`).
- Local copy: `src/shell/list-row.tsx` (123 lines, `li` with `data-list-row`, `data-row-identity`, `data-row-side`,
  `data-row-status`, `data-row-actions`, `data-row-link`, `data-row-title`); callers: 14 screens; tests and e2e reading
  `data-row-*`: `tests/shell/list-row-markup.test.tsx`, `tests/support/row-markup.ts`, `e2e/expect-row-state.ts`,
  `e2e/expect-side-holds-state-and-controls.ts`, `e2e/expect-routine-row.ts`, `e2e/expect-send-row.ts`,
  `e2e/row-facts.spec.ts` and others (grep `data-row-`).
- The routine row puts the switch and the menu together in `RoutineRowControls` (`routine-forms.tsx`); the Broadcast
  row's menu comes from `pickSendControls` (`send-controls.ts`) and `SendRowMenu`.

## Constraints
- Owns exclusively: every `ListRow` caller named in the item, `src/shell/list-row.tsx`, `src/shell/row-inset.ts`, `src/routines/routine-forms.tsx`, `src/broadcast/send-row-menu.tsx`, `src/broadcast/send-controls.ts`, `e2e/expect-*.ts`, `tests/support/row-markup.ts` and the row tests. Keeps the local `ResultBadge` and `RowActionsMenu` as they are (CT-28 and CT-27 replace them); only moves the menu into the `menu` slot.
- Build on `@softure-ai/theme-notion` (AGENTS.md "SOFTURE packages first"): use the package component as it is; a
  missing piece becomes an issue in SOFTURE/AI, never a local wrapper or override.
- The roadmap's binding layout rule for CT-25..CT-28 (section "Slices"): no screen ends up less tidy than its CT-24
  screenshot.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts`.
- On a phone the right column wraps under the identity; controls at least 44 px.
- Each row's own `data-*` attributes stay, so the e2e specs keep finding rows.
- No migration. No release, tag, publish or deploy (the owner's word; F-3: the deploy waits for CT-25..CT-28).
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
