---
change_id: project-settings-tab
title: "A project's Settings tab picks its group"
status: archived
roadmap_item: CT-31
created: 2026-11-26
branch: claude/project-thread-6wahnf
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
Every project's page has a last tab "Settings" ("Ustawienia") whose first setting is the project's group: a dropdown of the groups defined in Settings plus "No group"; picking one saves at once and the project moves to that group everywhere on the next render.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-31: A project's Settings tab picks its group
- **Change ID:** `project-settings-tab`
- **Status:** ready
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
- **Input:** context/changes/project-settings-tab/change.md

Findings gathered while recording it (master c993926):
- Owner, 2026-11-26 09:24Z (F-7, translated, with a screenshot of the Broadcast project picker): group the projects
  by theme, groups defined in Settings, each project assigned on its own Settings tab with a dropdown, and the
  projects list, the sidebar and the pickers laid out by group.
- The tab bar is built by `buildProjectTabs` in `src/project-page/project-tabs.ts` and rendered with the theme's `TabBar`/`TabPanel` in `app/(app)/projects/[owner]/[name]/page.tsx`.
- The setting row is the shared `src/settings/settings-row.tsx` that Settings uses.

## Constraints
- Owns exclusively: `src/project-page/project-tabs.ts`, `tests/project-page/project-tabs.test.ts`, `app/(app)/projects/[owner]/[name]/**`, `src/project-page/project-settings-section.tsx`, `src/project-page/project-group-select.tsx` (lane H).
- Starts once CT-29 and CT-30 are merged; Waiting stays the default tab (CT-29).
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

## Done
- The project page ends with a Settings tab (never the default) whose group select saves at once; the shared
  `SettingsRow` gained an optional status and phone stacking. Waiting: release (rides the CT-25..CT-35 release).
