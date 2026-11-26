# Plan: project-groups-in-settings

## Approach
A migration adds `projects.project_groups` and `repositories.group_id` and seeds one group per owner. The module
`modules/projects/groups.ts` reads and writes groups with results as values. `src/projects/group-projects.ts` holds
the pure `groupProjects` and `compareGroupNames`. Settings gets a "Project groups" card (add form, list, row menu with
Rename dialog and Delete confirmation). `addRepository` puts a new repository into the group whose default owner
matches, in the same insert.

## Key decisions
- D1: Settings lists every group (empty ones too, to rename or delete them), in `compareGroupNames` order;
  `groupProjects` (for the grouped surfaces) leaves empty groups out, as the roadmap says.
- D2: the default group is set inside the insert (`group_id = (SELECT id … WHERE default_owner = lower(owner))`), so
  no second write and no race.
- D3: the "New projects from" owner is trimmed and lower-cased before validation (`^[a-z0-9-]{1,39}$` or empty).
- D4: duplicate name/owner are told apart by the unique constraint's name; both are field errors.
- D5: `setProjectGroupAction` lands here (module + action), so CT-31 only adds its dropdown.
- D6: e2e: the "projects under No group on the Projects page" check belongs to CT-32 (the Projects page is not grouped
  before it); here the e2e checks the group's count drops out with the group and the other group keeps its count.
- D7: the e2e owners are fictional: `atlas-works` (two repositories) and `Birch-Labs` (one), added to the fake forge.

## Phase 1: Data (TDD)
- `0009_create_project_groups.sql` with rollback header; schema; `groups.ts` (findProjectGroups with counts,
  insertProjectGroup, renameProjectGroup, deleteProjectGroup, setRepositoryGroup); `WatchedRepository.groupId`;
  `insertRepository` takes the owner for the default group.
- Done when: module tests (PGlite) and the migration seed test pass.

## Phase 2: Grouping helper (TDD)
- `group-projects.ts`: `groupProjects`, `compareGroupNames`, `createGroupCollator(locale)`.
- Done when: unit tests (no groups; all grouped; No group last; empty left out; accented name before "Zeta"; order
  kept) pass.

## Phase 3: Settings section
- `load-project-groups.ts`, `project-groups-section.tsx`, `project-group-forms.tsx`, actions (add, rename, delete,
  set group) with zod; messages en/pl `projectGroups`.
- Done when: action validation tests pass, gates green.

## Phase 4: e2e and evidence
- `e2e/project-groups.spec.ts` at 1280 and 390; screenshots list/menu/rename/delete × 1280/390 × light/dark into the
  evidence store; migration run over a `v2026.11.25-3` database.
- Done when: full e2e green locally, screenshots looked at.

## Merge
Every CI job green on the pull request before the merge; master's CI read on the merge commit after it (the
thread's merge duty, reported to the coordinator, not a Progress item).

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Data

#### Automated
- [x] 1.1 Module tests: insert, duplicate name and owner as values, rename, delete sets `group_id` null, set a repository's group, unknown id as a value — d7cb598 (`tests/projects/groups.test.ts` 7/7)
- [x] 1.2 Migration seed test: two owners, three repositories → two groups, all assigned, owner's case kept — d7cb598 (`tests/projects/project-groups-migration.test.ts`)
- [x] 1.3 `addRepository` joins the matching default group; none when no owner matches — d7cb598 (`tests/projects/add-repository.test.ts`)

### Phase 2: Grouping helper

#### Automated
- [x] 2.1 `groupProjects` unit tests — d7cb598 (`tests/projects/group-projects.test.ts` 9/9)

### Phase 3: Settings section

#### Automated
- [x] 3.1 Server action validation tests (name 1..60 trimmed, owner pattern, field errors) — ca271b8 (`tests/projects/project-group-input.test.ts` 8/8)
- [x] 3.2 Gates green: typecheck, lint, test — ca271b8 (unit 826/826)

### Phase 4: e2e and evidence

#### Automated
- [x] 4.1 `e2e/project-groups.spec.ts` green at 1280 and 390; full e2e green locally — 1a09f8d (95/95, and again with 4 workers)
- [x] 4.2 Migration over a database at `v2026.11.25-3` with rows of two owners — a database migrated at the tag's checkout, three repositories of `Atlas-Works`/`atlas-works` and `birch-labs`, then master's `npm run migrate`: `0009` applied, groups `Atlas-Works` (2) and `birch-labs` (1), every repository assigned
- [x] 4.3 Screenshots (list, menu, rename, delete × 1280/390 × light/dark) saved and looked at — /mnt/project-files/cockpit/evidence/project-groups-in-settings/ (16 files, 01-list, 02-menu, 03-rename, 04-delete)
