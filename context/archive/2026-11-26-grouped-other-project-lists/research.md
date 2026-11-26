# Research: grouped-other-project-lists

Master `bc955f6` (CT-30, CT-31, CT-32 merged; CT-33 and CT-34 in flight, touching none of this change's files).

## How it works today
- **Scan status** (`app/(app)/scan-status/page.tsx`): a "Projects" `SectionCard` with a count holds one theme `List`
  (`scan.listLabel` "Projects by last read", `border-t`) of `ScanProjectRow`, in watch order from `loadScanStatus()`
  (`src/scan/scan-status.ts`). `ProjectScanRow` carries `key`, `fullName`, read facts; no group.
- **Packages** (`app/(app)/packages/page.tsx`): the "Last scan" line, then one `SectionCard` per Node project (title =
  full name, "N behind" description, "Open project" link) holding `PackagesDetails`; rows from `loadPackagesPage()`
  (`src/adapters/packages/load-packages.ts`) in watch order. A "row" here is a card, not a list item.
- **Deploys** (`app/(app)/deploys/page.tsx`): one theme `List` (`deploys.listLabel` "Apps with a deploy workflow") of
  `ListEntry` rows from `getDeployRows` (`src/adapters/deploy/deploys-view.ts`), sorted by full name; projects without
  a deploy workflow are left out.
- All three loaders read `findRepositories(db)`, which since CT-30 returns `groupId`; none passes it on.
- CT-30/CT-32 give `groupProjects`, `createGroupCollator`, `loadProjectGroups()` and `ProjectGroupSections` (section
  with `aria-label` "Group: X", h2 name + muted count, theme `List` roomy `border-y` labelled by the caller's template).
  `ProjectGroupSections` always wraps rows in a `List`: it has no way to hold cards (the Packages page).

## Audit: every list of projects in COCKPIT
| Screen / list | Rows are | Verdict |
| --- | --- | --- |
| Projects (`app/(app)/projects/page.tsx`) | projects | grouped (CT-32) |
| Settings, Watched repositories | projects | grouped (CT-32) |
| Sidebar project list | projects | grouped by CT-33 |
| Broadcast project picker | projects | grouped by CT-34 |
| Scheduled task project picker | projects | grouped by CT-38 (shared picker of CT-34) |
| Scan status, Projects card | projects | **grouped here** |
| Packages | one card per project | **grouped here** |
| Deploys | apps (projects with a deploy workflow) | **grouped here** |
| Inbox | owner-queue entries | stays: each row names its project |
| Broadcast history and a broadcast's sends | broadcasts / sends | stays: each send row names its project |
| Scheduled tasks | tasks | stays: each row names its projects |
| Project page tabs (history, roadmap, routines) | one project's facts | stays: inside one project |
| Settings, Project groups | groups | stays: not projects |

## e2e that read these lists by name
- "Projects by last read": `e2e/scan-until-settled.ts` (every scanning spec), `scan.spec.ts`, `header-refresh.spec.ts`,
  `row-facts.spec.ts`. Once the list is per group its name gains the group; they must find rows in the "Projects" card
  instead (one region, every group).
- "Apps with a deploy workflow": `deploys.spec.ts` (rows by `data-project`, `expectListEntryRows` on the list).
- Packages cards are found by their region name (`packages.spec.ts`, `row-facts.spec.ts`): unchanged.
- e2e shares one database; groups take new projects by forge owner (`atlas-works`, `birch-labs`, `elm-works`,
  `fir-labs` are taken). `example-org/*` projects stay in No group.

## Risks
- Deploys: a group whose projects all lack a deploy workflow gets no section (`groupProjects` drops empty groups).
- h2 of a group inside a card whose own title is an h2 (Scan status): same nesting as Settings' watched list (CT-32).

## SOFTURE modules
- `@softure-ai/theme-notion` `List`/`ListItem`/`ListEntry`/`Card` already used; nothing missing.

## Notes
- Frame skipped: the owner's explicit feature with the split recorded in the roadmap (change.md).
