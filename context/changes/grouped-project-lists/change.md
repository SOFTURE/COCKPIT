---
change_id: grouped-project-lists
title: "The projects list grouped, with the shared group sections"
status: new
roadmap_item: CT-32
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The Projects page shows one section per project group (No group last) instead of one per status, rows inside a group ordered by status (as `PROJECT_STATUSES` orders them) then by name, each row keeping its status badge; the Settings list of watched repositories is grouped the same way; both through one shared `ProjectGroupSections` component that CT-35 applies to the remaining project lists.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-32: The projects list grouped, with the shared group sections
- **Change ID:** `grouped-project-lists`
- **Status:** ready
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
- **Input:** context/changes/grouped-project-lists/change.md

Findings gathered while recording it (master c993926):
- Owner, 2026-11-26 09:24Z (F-7, translated, with a screenshot of the Broadcast project picker): group the projects
  by theme, groups defined in Settings, each project assigned on its own Settings tab with a dropdown, and the
  projects list, the sidebar and the pickers laid out by group.
- `app/(app)/projects/page.tsx` renders `overview.groups` (one section per status, an `h2` with `ProjectStatusBadge` and a count, then a theme `List` of `OverviewRow`); each `OverviewRow` already shows its own `ProjectStatusBadge`.
- `app/(app)/layout.tsx` also reads `loadOverview` (status by key for the sidebar).

## Constraints
- Owns exclusively: `src/projects/project-group-sections.tsx`, `app/(app)/projects/page.tsx`, `src/overview/**`, `src/projects/watched-repository-list.tsx`, the watched list's props in `app/(app)/settings/page.tsx` (lane I).
- Starts once CT-30 is merged.
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
