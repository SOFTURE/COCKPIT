# Plan: grouped-project-lists

## Approach
`buildOverview` carries each project's `groupId` onto its row and exposes `rows` in status order, then name; the status
`groups` stay for the digest, MCP and CLI. A new server component `ProjectGroupSections` renders the sections of
`groupProjects`: per section a `section` (`aria-label` "Group: X"), an `h2` with the name and a muted count, and a theme
`List` (`roomy`, `border-y`) whose label the caller gives; it owns heading, count and spacing (24 px between sections,
4 px heading to list) and draws nothing for no sections. The Projects page and Settings' watched list both use it.

## Key decisions (auto)
- D1: Keep `overview.groups` (digest, MCP `get_overview`, CLI read it); add `overview.rows`. Recorded unknown answered.
- D2: `OverviewProject.groupId` is optional (absent = No group) so the digest, which needs no group, is untouched.
- D3: Messages in a new `projectGroupSections` block: `sectionLabel` "Group: {name}", `noGroup`, `projectsListLabel`
  "Projects: {group}", `repositoriesListLabel` "Watched repositories: {group}". The unused `overview.groupLabel` goes;
  `overview.description` no longer says "grouped by status".
- D4: The component takes `sections`, `copy`, `listLabel` (template with `{group}`), `getKey` and `renderRow`; no client
  code (both callers are server components).
- D5: e2e status checks move from the status lists to the row's status slot. New spec `e2e/grouped-projects.spec.ts`
  with fictional owners `elm-works` and `fir-labs` and `example-org/loose-app` (fake forge), covering order, counts,
  No group last, the Settings list, moving a project through the CT-31 select, and a deleted group's project under No
  group.

## Phase 1: Overview rows (TDD)
- `build-overview.ts`: `groupId` on project and row; rows sorted by status index then name; `rows` on `Overview`.
- Test: rows ordered by status then name; `groupId` carried, absent = null; `groups` unchanged.
- Done when: `tests/overview/build-overview.test.ts` green.

## Phase 2: ProjectGroupSections (TDD)
- `src/projects/project-group-sections.tsx` + `tests/projects/project-group-sections.test.tsx` (static markup): headings
  and counts, section and list labels, order as given, No group last with its label, nothing for no sections.
- Done when: the test is green.

## Phase 3: Screens
- Projects page and Settings watched list on the component; messages en/pl; MCP comment.
- Done when: gates green (typecheck, lint, test).

## Phase 4: e2e and evidence
- Update overview, health, mcp specs; new grouped-projects spec at 1280 and 390; screenshots before (master) and after,
  Projects page and Settings watched list × 1280/390 × light/dark, looked at.
- Done when: the touched specs pass three runs in a row, the full e2e green locally, screenshots looked at.

## Merge
Every CI job green before the merge; master CI read on the merge commit after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Overview rows

#### Automated
- [x] 1.1 `buildOverview` rows in status then name order with `groupId`; status groups unchanged — d27444b (`tests/overview/build-overview.test.ts` 18/18)

### Phase 2: ProjectGroupSections

#### Automated
- [x] 2.1 Markup test: headings, counts, labels, order, No group last, nothing for no sections — d27444b (`tests/projects/project-group-sections.test.tsx` 5/5)

### Phase 3: Screens

#### Automated
- [x] 3.1 Gates green: typecheck, lint, test — d27444b (unit 846/846)

### Phase 4: e2e and evidence

#### Automated
- [x] 4.1 Touched specs green three runs in a row; full e2e green locally — 1308284 (grouped-projects 3/3 alone; touched specs 17/17 twice; full e2e 107/107)
- [x] 4.2 Screenshots before and after (Projects page, Settings watched list × 1280/390 × light/dark) saved and looked at — /mnt/project-files/cockpit/evidence/grouped-project-lists/ (16 files, 01-projects, 02-watched-list)
