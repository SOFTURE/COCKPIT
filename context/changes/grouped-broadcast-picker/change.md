---
change_id: grouped-broadcast-picker
title: "The Broadcast project picker grouped"
status: new
roadmap_item: CT-34
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The Broadcast form's "Projects" picker shows one fieldset per project group (No group last), each with a checkbox that selects or clears the whole group; "Select all", "Clear all" and "Selected: N of M" keep working across groups.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-34: The Broadcast project picker grouped
- **Change ID:** `grouped-broadcast-picker`
- **Status:** ready
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
- **Input:** context/changes/grouped-broadcast-picker/change.md

Findings gathered while recording it (master c993926):
- Owner, 2026-11-26 09:24Z (F-7, translated, with a screenshot of the Broadcast project picker): group the projects
  by theme, groups defined in Settings, each project assigned on its own Settings tab with a dropdown, and the
  projects list, the sidebar and the pickers laid out by group.
- `src/broadcast/broadcast-form.tsx` renders the projects as one `ul` grid (1/2/3/4 columns) of theme `Checkbox`es with Select all / Clear all and "Selected: N of M" (owner's screenshot, F-7).

## Constraints
- Owns exclusively: `src/broadcast/broadcast-form.tsx`, `src/broadcast/broadcast-form-state.ts`, `app/(app)/broadcast/page.tsx` (lane K).
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
