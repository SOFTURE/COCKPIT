---
change_id: fold-rows-on-theme-status
title: "Roadmap item rows on the theme's FoldRow column"
status: archived
roadmap_item: CT-25
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
An item row of the roadmap view (a project's Roadmap tab, the promote control included) is theme-notion's `FoldRow` with its `status` (the status pill and the owner-step tag) and `actions` (the promote control) in the row's right column, lit with the bar as one box; the local `StatusActionFoldRow` (CT-11) and its inert placeholder copy of the action are deleted.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-25: Roadmap item rows on the theme's FoldRow column
- **Change ID:** `fold-rows-on-theme-status`
- **Status:** ready
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

Findings gathered while recording it (theme-notion 0.35.0 from npm, master 8b630c2):
- Owner, 2026-11-26 07:15Z (translated, F-3): "the changes that are done in the Notion package: bump them and carry
  them out still before the deployment, so that the app is switched over to the newest package".
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos": the Layout and
  Verification lines above are binding.
- Package: `FoldRow` (theme-notion 0.32.0, SOFTURE/AI#1471) takes `status` and `actions`; the right column spans the
  summary's full height and lights with it; `data-slot="fold-row-status"` and `"fold-row-action-list"`; with a column
  the row is a grid (`data-slot="fold-row-with-actions"`) and the opened content is the details' sibling.
- Local copy: `src/shell/status-action-fold-row.tsx` (72 lines) lays the action over an inert copy held in the summary;
  its one caller is `RoadmapItemRow` in `src/roadmap/roadmap-view.tsx` (`id`, `className="scroll-mt-16"`,
  `data-item`, `data-status`, `status` pill + owner-step tag, `action`, `detailsLabel`/`details`, children).

## Constraints
- Owns exclusively: `src/roadmap/roadmap-view.tsx`, `src/shell/status-action-fold-row.tsx`, the roadmap view's unit tests, `e2e/project-page.spec.ts`, `e2e/promote.spec.ts`. Runs in parallel with CT-26, which does not touch these files.
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
- Frame skipped: the outcome, layout and verification are fixed by the roadmap item (owner order F-3).
- Archived 2026-11-26: roadmap item rows use theme-notion's `FoldRow` `status`/`actions` column and the local
  `StatusActionFoldRow` is deleted; evidence in the project files under `cockpit/evidence/fold-rows-on-theme-status/`.

## Decisions (auto)
- The package's vertical centring of the chevron and the right column on a multi-line summary is kept as it is (no
  local override, per the package-first rule); the start-aligned option is asked for in SOFTURE/AI#1495.
- The status pill and the owner-step tag share one line in `fold-row-status` (`flex gap-2`).
