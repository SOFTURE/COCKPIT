---
change_id: project-page-opens-on-waiting
title: "A project's page always opens on Waiting"
status: new
roadmap_item: CT-29
created: 2026-11-26
updated: 2026-11-26
---

## Intent
Opening a project's page without a `tab` in the address always shows the Waiting tab, whatever the project reports;
a `?tab=` naming an available tab still opens that tab, and an unknown or unavailable one falls back to Waiting.

## Context
The roadmap item (cockpit-v4), verbatim:

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

Findings gathered while recording it (master 101210c):
- Owner, 2026-11-26 07:47Z (translated, F-5, with a screenshot of a project page opened on Produkcja with every
  counter at 0): "the Waiting tab always opens by default, not Production".
- Cause: `buildProjectTabs` in `src/project-page/project-tabs.ts` picks `tabs.find(hasContent)?.key ?? "waiting"`;
  `hasContent` is true for `production` whenever the tab exists, so a project with health or a deploy opens on
  Production. The unit test `opens the first tab with something in it` pins the old behaviour (CT-5) and changes here.
- The current tab is rendered by the theme's `TabBar` from `tabs.current` in `app/(app)/projects/[owner]/[name]/page.tsx`.

## Constraints
- Owns exclusively: `src/project-page/project-tabs.ts`, `tests/project-page/project-tabs.test.ts` and the e2e specs it
  must adjust; does not touch `src/project-page/project-page-sections.tsx` (CT-26's).
- Rides the release with CT-25 and CT-26 (owner, F-5).
- No migration. No release, tag, publish or deploy.
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- Frame skipped: the owner's explicit order and a one-line root cause.
