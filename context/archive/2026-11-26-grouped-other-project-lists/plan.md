# Plan: grouped-other-project-lists

## Approach
Each loader passes the repository's `groupId` onto its row; each page loads the groups (`loadProjectGroups`) and
renders `groupProjects(rows, groups)` with the shared `ProjectGroupSections`. Rows keep their content and their order
inside a group (Scan status and Packages: watch order; Deploys: name). The shared component gets one option,
`layout: "list" | "stack"`: `list` (default) is today's theme `List`; `stack` puts the caller's blocks (the Packages
cards) one under the other with the same heading, count and spacing, so no screen draws its own group heading.

## Key decisions (auto)
- D1: `ProjectGroupSections` gains `layout` (default `list`) instead of a Packages-only heading: one standard (F-2).
  In `stack` the section holds a `div` (`grid gap-4`, the gap between Packages cards today) and `listLabel` is not
  used, so the prop becomes optional for that layout (discriminated props).
- D2: List labels carry the group: `scan.listLabel` "Projects by last read: {group}", `deploys.listLabel` "Apps with a
  deploy workflow: {group}" (pl likewise). No new message block is needed.
- D3: Scan status keeps its "Projects" card and total count; the sections sit inside it (as on Settings).
- D4: e2e helpers find Scan status rows in the "Projects" region, not one list; deploys.spec reads its rows in the
  "No group" list. New spec `e2e/grouped-other-lists.spec.ts` with fictional owners `oak-works` (oak-app: packages and
  deploy; oak-docs: packages only) and `hazel-labs` (hazel-app: packages only) and `example-org/stray-app` (packages and
  deploy), so Deploys shows no Hazel section (empty group left out).

## Phase 1: Shared component and rows (TDD)
- `project-group-sections.tsx`: `layout` option; test the stack layout (no list, blocks in order, same headings).
- `ProjectScanRow`, `PackagesRow`, `DeployRow` carry `groupId`; `getDeployRows` passes it (test).
- Screen components: `ScanProjectSections` (`src/scan/scan-project-sections.tsx`), `PackagesSections`
  (`src/adapters/packages/packages-sections.tsx`), `DeploysList` grouped; unit tests per screen: rows under their
  groups, an empty group left out, No group last.
- Done when: the new and touched unit tests are green.

## Phase 2: Screens and messages
- The three pages load groups and render the section components; messages en/pl.
- Done when: gates green (typecheck, lint, test).

## Phase 3: e2e and evidence
- Fixtures and fake forge repos; the new spec at 1280 and 390 px; touched specs updated; screenshots before (master)
  and after of the three screens × 1280/390 × light/dark, saved to the evidence store and looked at.
- Done when: the new and touched specs pass three runs in a row, the full e2e green locally, screenshots looked at.

## Merge
Every CI job green before the merge; master CI read on the merge commit after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Shared component and rows

#### Automated
- [x] 1.1 Stack layout of `ProjectGroupSections`; rows carry `groupId`; per-screen section tests green — 26919a3 (`tests/projects/project-group-sections.test.tsx` 6/6, `tests/scan/scan-project-sections.test.tsx` 3/3, `tests/adapters/packages-sections.test.tsx` 3/3, `tests/adapters/deploys-list.test.tsx` 2/2, `tests/adapters/deploys-view.test.ts` 4/4)

### Phase 2: Screens and messages

#### Automated
- [x] 2.1 Gates green: typecheck, lint, test — 26919a3 (unit 903/903)

### Phase 3: e2e and evidence

#### Automated
- [x] 3.1 New and touched specs green three runs in a row; full e2e green locally — 26919a3 (touched specs 18/18, then 16/16 twice; full e2e 109/109; polish.spec moved to the Projects card after the first full run)
- [x] 3.2 Screenshots before and after (Scan status, Packages, Deploys × 1280/390 × light/dark) saved and looked at — /mnt/project-files/cockpit/evidence/grouped-other-project-lists/ (24 files: 01-scan-status, 02-packages, 03-deploys)
