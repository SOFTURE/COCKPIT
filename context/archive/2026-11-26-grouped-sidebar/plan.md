# Plan: grouped-sidebar

## Approach
The layout builds the sidebar's projects as today plus `groupId`, lays them out with `groupProjects` and passes the
sections (`projectSections`) through `AppShell` to `AppSidebar`. The sidebar renders, after the navigation group, one
theme `SidebarGroup` per section: `SidebarGroupLabel` holding a truncated `span` with the full name as `title`, then a
`SidebarMenu` labelled with the group's name of the same links as today. No sections: the single "Projects" label and
its empty line, as today. The sidebar neither groups nor sorts.

## Key decisions (auto)
- D1: `AppSidebar` takes `projectSections: ProjectGroupSection<SidebarProject>[]` instead of `projects`;
  `SidebarProject` extends `GroupedProject`.
- D2: The "No group" label comes from a new `shell.projectsNoGroup` key in both message dictionaries, so the sidebar
  needs only the shell copy.
- D3: The project link becomes a small `SidebarProjectLink` in the same file (one job per function), markup unchanged.
- D4: e2e: new `e2e/grouped-sidebar.spec.ts` with fixtures `GROUPED_SIDEBAR_REPOSITORIES` (fake forge serves them);
  the three specs that read the "Projects" list read "No group". The evidence capture sits before the assertions so
  the same spec on master gives the "before" screenshots.

## Phase 1: Sidebar in groups (TDD)
- `tests/shell/app-sidebar.test.tsx` (static markup inside `SidebarProvider`, `usePathname` mocked): labels in order,
  links under their group, No group last, empty group left out, title on the label, status icon, touch classes and the
  active link kept, only No group, the empty state.
- `src/shell/app-sidebar.tsx`, `src/shell/app-shell.tsx`, `app/(app)/layout.tsx`, `messages/en.ts`, `messages/pl.ts`.
- Done when: the test and the gates (typecheck, lint, test) are green.

## Phase 2: e2e and evidence
- `e2e/grouped-sidebar.spec.ts` at 1280 and 390 (sheet open): labels and links in order, `aria-current="page"`, 44 px
  links, footer on the 844 px screen, no horizontal scroll; the three specs updated.
- Screenshots of the sidebar at 1280 and 390 (sheet open), light and dark, before (master) and after, looked at.
- Done when: the new spec passes three runs in a row, the full e2e is green locally, screenshots looked at.

## Merge
Every CI job green before the merge; master CI read on the merge commit after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Sidebar in groups

#### Automated
- [x] 1.1 Sidebar markup test: labels, links per group, No group last, title, status icon, active link, empty state — ff95255 (`tests/shell/app-sidebar.test.tsx` 5/5)
- [x] 1.2 Gates green: typecheck, lint, test — ff95255 (unit 851/851)

### Phase 2: e2e and evidence

#### Automated
- [x] 2.1 New spec green three runs in a row; touched specs and the full e2e green locally — ff95255 (grouped-sidebar 2/2 three runs; touched specs 19/19; full e2e 109/109)
- [x] 2.2 Screenshots before and after (sidebar × 1280/390 × light/dark) saved and looked at — /mnt/project-files/cockpit/evidence/grouped-sidebar/ (8 files, 01-sidebar)
