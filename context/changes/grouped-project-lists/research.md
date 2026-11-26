# Research: grouped-project-lists

Master `d55c2ff` (CT-30 and CT-31 merged).

## How it works today
- `app/(app)/projects/page.tsx` loads the inbox and scan status, then `loadOverview(inbox)`, and renders
  `overview.groups` (one per status in `PROJECT_STATUSES` order): a `section` labelled `Projects: {status}` with an `h2`
  holding a `ProjectStatusBadge` and a muted count, then a theme `List` (`density="roomy"`, `border-y`) of `OverviewRow`.
  Each `OverviewRow` already shows its own `ProjectStatusBadge` in the right column, so the status is said twice.
- `buildOverview` (`src/overview/build-overview.ts`) builds one row per project, sorts rows by `fullName`
  (`localeCompare`), and splits them into status groups. `OverviewProject` is `{ key, fullName }`; rows carry no group.
- `loadOverview` reads `findRepositories` (which since CT-30 returns `groupId`) but passes only `key` and `fullName`.
- `src/projects/watched-repository-list.tsx` renders one flat `List` (`border-t`) of `ListEntry` rows in Settings'
  "Watched repositories" card; empty: one muted line.
- CT-30 gives `groupProjects(projects, groups, { collator })`, `sortGroups`, `createGroupCollator(locale)`
  (`src/projects/group-projects.ts`) and `loadProjectGroups()` (groups with counts; `{ id, name, ... }`).

## Who reads `overview.groups` (the unknown)
- `src/digest/build-snapshot.ts`: flattens the groups into rows by key (needs every row, not the grouping).
- `src/mcp/answers.ts` `toOverviewAnswer`: the MCP `get_overview` answer is grouped by status; `e2e/mcp.spec.ts`,
  `e2e/ci-from-pull-request.spec.ts`, `tests/mcp/answers.test.ts` read that contract.
- `tests/cli/run-cli.test.ts`: the CLI prints the MCP answer.
- Answer: the status groups stay as data (digest, MCP, CLI); only the Projects page stops using them. The page reads a
  new `overview.rows` (status order, then name), grouped by `groupProjects`.

## e2e that read the status lists by name
- `e2e/overview.spec.ts` (`Projects: {status}` for five projects, and `expectListEntryRows` on `Projects: Broken`),
  `e2e/health.spec.ts` (Broken, Idle), `e2e/mcp.spec.ts` (Waiting for you). Each must check the row's own status
  (`[data-slot=list-entry-status]`) instead.
- e2e repositories are added after the migration, so `example-org/*` projects are in No group unless a spec adds a
  group with `default_owner` `example-org` (none does). Groups from `project-groups.spec.ts` and
  `project-settings.spec.ts` share the database: a new spec must not fix the number or position of other groups.
- `e2e/project-settings.spec.ts` notes that the Projects page proof of a move waits for CT-32; CT-30 deferred "a deleted
  group's projects show under No group on the Projects page" to CT-32.
- The fake forge serves only listed repositories (`FAKE_REPOSITORIES` in `e2e/fake-forge.ts`): new fixtures go there.

## Risks
- Shared e2e database: group names unique to the new spec; assert relative order only.
- `app/(app)/layout.tsx` reads `loadOverview` for `statusByKey`; unchanged.
