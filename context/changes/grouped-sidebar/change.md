---
change_id: grouped-sidebar
title: "The sidebar's projects grouped"
status: plan_reviewed
roadmap_item: CT-33
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The sidebar's project links show under one label per project group (No group last) instead of one "Projects" list, each link keeping its status icon and its active state.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-33: The sidebar's projects grouped
- **Change ID:** `grouped-sidebar`
- **Status:** ready
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
- **Input:** context/changes/grouped-sidebar/change.md

Findings gathered while recording it (master c993926):
- Owner, 2026-11-26 09:24Z (F-7, translated, with a screenshot of the Broadcast project picker): group the projects
  by theme, groups defined in Settings, each project assigned on its own Settings tab with a dropdown, and the
  projects list, the sidebar and the pickers laid out by group.
- `src/shell/app-sidebar.tsx` renders one `SidebarGroup` labelled Projects with a `SidebarMenu` of `SidebarProject` links (status icon, truncated name); `app/(app)/layout.tsx` builds the list from `loadWatchedRepositories`.

## Constraints
- Owns exclusively: `src/shell/app-sidebar.tsx`, `src/shell/app-shell.tsx`, `app/(app)/layout.tsx` (lane J).
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
