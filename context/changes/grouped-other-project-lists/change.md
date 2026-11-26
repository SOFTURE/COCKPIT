---
change_id: grouped-other-project-lists
title: "Every other project list grouped"
status: planned
roadmap_item: CT-35
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The remaining screens that list one row per project (Scan status, Packages, Deploys) use CT-32's `ProjectGroupSections`, so every list of projects in COCKPIT is ordered the same way; an audit in research names each list of projects and its verdict.

## Context
The roadmap item (cockpit-v4), verbatim:

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

Findings gathered while recording it (master c993926):
- Owner, 2026-11-26 09:24Z (F-7, translated, with a screenshot of the Broadcast project picker): group the projects
  by theme, groups defined in Settings, each project assigned on its own Settings tab with a dropdown, and the
  projects list, the sidebar and the pickers laid out by group.
- Scan status (`ScanProjectRow`), Packages (`PackagesDetails`) and Deploys (`DeploysList`) list one row per project in watch order.

## Constraints
- Owns exclusively: `app/(app)/scan-status/**`, `src/scan/**`, `app/(app)/packages/**`, `src/adapters/packages/**`, `src/adapters/deploy/**` (lane I, after CT-32).
- Starts once CT-32 is merged.
- Build on `@softure-ai/theme-notion` (AGENTS.md "SOFTURE packages first"); a missing piece becomes an issue in
  SOFTURE/AI right away, never a local wrapper or override.
- The roadmap's binding layout rule for CT-30..CT-35 (section "Slices"); every grouped surface takes its sections from
  `groupProjects` (CT-30).
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts` (each item adds its own block); on a phone controls are at least 44 px.
- Fixtures, screenshots and test data are fictional (AGENTS.md "Open source and generic").
- No release, tag, publish or deploy: rides the one release of CT-25..CT-35 (owner, F-7).
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- Frame skipped: the owner's explicit feature with the split recorded in the roadmap.
