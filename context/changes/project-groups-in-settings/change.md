---
change_id: project-groups-in-settings
title: "Project groups defined in Settings"
status: new
roadmap_item: CT-30
created: 2026-11-26
updated: 2026-11-26
---

## Intent
Settings has a "Project groups" section where the owner adds, renames and deletes groups; every watched project belongs to at most one group (or to none); the existing projects start in one group per forge owner (a group named after the account or organization, which the owner renames); a repository added later joins the group whose "new projects from" owner matches its own; a deleted group's projects fall to "No group". The pure `groupProjects` helper that every grouped surface uses (CT-32..CT-35) lands here.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-30: Project groups defined in Settings
- **Change ID:** `project-groups-in-settings`
- **Status:** ready
- **Outcome:** Settings has a "Project groups" section where the owner adds, renames and deletes groups; every watched
  project belongs to at most one group (or to none); the existing projects start in one group per forge owner (a group
  named after the account or organization, which the owner renames); a repository added later joins the group whose
  "new projects from" owner matches its own; a deleted group's projects fall to "No group". The pure
  `groupProjects` helper that every grouped surface uses (CT-32..CT-35) lands here.
- **Prerequisites:** CT-27, CT-28 (the group row uses the theme's `RowActionsMenu` and `ResultBadge`, not the local
  copies they delete).
- **Touches (estimate):** `modules/projects/migrations/0009_create_project_groups.sql` (new),
  `modules/projects/schema.ts`, `modules/projects/groups.ts` (new: list, insert, rename, delete, set a repository's
  group; results as values), `modules/projects/queries.ts` (`WatchedRepository` gains `groupId`),
  `src/projects/load-repositories.ts`, `src/projects/add-repository.ts` (the default group on add),
  `src/projects/group-projects.ts` (new), `src/projects/load-project-groups.ts` (new),
  `src/projects/project-groups-section.tsx` (new), `src/projects/project-group-forms.tsx` (new: add form, rename
  dialog), `app/(app)/settings/page.tsx` (the new section only), `app/(app)/settings/actions.ts`, `messages/en.ts`,
  `messages/pl.ts` (a `projectGroups` block), tests under `tests/projects/**` and `tests/modules/**`,
  `e2e/project-groups.spec.ts` (new), `e2e/fixtures.ts` (watched repositories of two fictional owners).
- **Size:** M
- **Data:** `projects.project_groups` (`id` identity, `name` text 1..60 characters after trim, unique on
  `lower(name)`, `default_owner` text NULL, lower-case, unique, matching a forge account name, `created_at`);
  `projects.repositories.group_id` bigint NULL `REFERENCES project_groups(id) ON DELETE SET NULL`, indexed. The
  migration seeds one group per distinct owner in `repositories.full_name` (name as the forge writes it,
  `default_owner` its lower case) and assigns each repository to it, in the same migration. Rollback in the header:
  drop the column, drop the table, delete the migration row. The constraints are the first line (unique names, the
  foreign key); the server actions check them again only to name the field in the error.
- **Rules:**
  - `groupProjects(projects, groups, { collator })` returns `{ group: { id, name } | null; projects }[]`: groups
    ordered by name with the app's locale collator, projects inside a group in the caller's order, groups with no
    project left out, the `null` ("No group") section last and only when it has projects. Every grouped surface uses
    it; none sorts or groups on its own.
  - Adding, renaming and deleting a group and setting a project's group are server actions behind the signed-in check
    the repository actions use; input is narrowed with zod (name trimmed, 1..60; owner `^[a-z0-9-]{1,39}$` or empty).
  - A duplicate name or owner is a field error ("A group with this name already exists"), never a 500.
- **Unknowns:**
  - Whether the seed should skip an owner with a single repository: recommended, no (one rule, the owner merges groups
    by renaming and reassigning). (owner: research; blocks: no)
- **Risk:** the migration runs on production data at the next deploy; the run tests it the way the release check does
  (a database at the live tag's schema with rows of two owners, then master's migrations over it).
- **Baseline:** today no group exists and nothing reads one; after: every watched repository has a `group_id` after
  the migration, and Settings lists one group per owner with its project count.
- **Layout:** Settings, between "Repositories" and "Team", a `SectionCard` "Project groups" (`id`
  `project-groups-heading`, description "Groups order the projects list, the sidebar and the project pickers. Pick a
  project's group on its Settings tab."). Inside, top to bottom: the add form on one line from `md` (Name input, the
  optional "New projects from" input with field help "A forge account or organization; repositories of it added later
  join this group", then the Add button; stacked full width on a phone, controls 44 px), then a theme `List` of the
  groups, ordered as `groupProjects` orders them. A group row is a `ListEntry`: identity = the group's name, one muted
  detail line "N projects · new from: owner" (the second part only when set); right column = the row menu only
  (Rename, separator, Delete in the danger tone). Rename opens a dialog with both fields prefilled; Delete opens the
  confirm dialog "Delete the group X? Its N projects move to No group." No group rows: the empty line "No groups yet.
  Every project shows under No group."
- **Verification:** unit tests: `groupProjects` (no groups; every project grouped; some ungrouped, "No group" last;
  an empty group left out; the locale collation of a name that starts with an accented capital (it sorts with its base letter, before "Zeta"); the caller's order kept inside
  a group); the module functions against PGlite (insert, duplicate name and owner as values, rename, delete sets
  `group_id` null, set a repository's group, an unknown group id as a value); the migration seed (two owners, three
  repositories → two groups, every repository assigned, the case of the owner kept in the name); `addRepository`
  assigns the matching default group and leaves none when no owner matches; the server actions' validation. e2e
  (`e2e/project-groups.spec.ts`) at 1280 and 390 px: the seeded groups listed with counts; add a group; a duplicate
  name shows the field error; rename it; delete it with Cancel, then confirm, and its projects show under No group
  on the Projects page; focus returns to the row menu after each dialog. Screenshots of the Settings section (list,
  open row menu, rename dialog, delete dialog) at 1280 and 390 px, light and dark, saved with `softure-evidence` and
  linked from the plan's Progress; the run looks at each one itself before READY. All CI jobs green before the
  merge; master CI green after it.
- **PRD refs:** F-7
- **Input:** context/changes/project-groups-in-settings/change.md

Findings gathered while recording it (master c993926):
- Owner, 2026-11-26 09:24Z (F-7, translated, with a screenshot of the Broadcast project picker): group the projects
  by theme, groups defined in Settings, each project assigned on its own Settings tab with a dropdown, and the
  projects list, the sidebar and the pickers laid out by group.
- `projects.repositories` (migration 0001) holds `repository_key` (lower case `owner/name`) and `full_name`; the next migration number is 0009 (`modules/projects/migrations`).
- Settings (`app/(app)/settings/page.tsx`) has the sections Repositories, Team (admin) and Account; server actions in `app/(app)/settings/actions.ts`.
- theme-notion 0.37.0 exports `Select`/`SelectGroup`/`SelectLabel`, `FieldSet`/`FieldLegend`, `Checkbox`, `SidebarGroup`/`SidebarGroupLabel`, `List`/`ListEntry`/`ListGroup`/`ListGroupHeading`, `RowActionsMenu` and `ResultBadge`: no package gap for this slice.

## Constraints
- Owns exclusively: the migration `0009_*`, `modules/projects/schema.ts`, `modules/projects/groups.ts`, `modules/projects/queries.ts`, `src/projects/load-repositories.ts`, `src/projects/add-repository.ts`, `src/projects/group-projects.ts`, `src/projects/load-project-groups.ts`, `src/projects/project-group*.tsx`, `app/(app)/settings/actions.ts`, the new section in `app/(app)/settings/page.tsx`, `e2e/fixtures.ts` (lane G).
- Starts once CT-27 and CT-28 are merged.
- The migration moves forward only and states its rollback; it is tested on a database at the live tag's schema with rows of two owners before READY.
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
