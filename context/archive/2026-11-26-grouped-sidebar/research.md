# Research: grouped-sidebar

Master `8a81353` (CT-30, CT-31, CT-32 merged).

## How it works today
- `app/(app)/layout.tsx` loads the watched repositories, the inbox and the scan progress, builds one flat list of
  `SidebarProject` (`slug`, `name`, `statusIcon` from `overview.statusByKey`) and passes it through `AppShell` to
  `AppSidebar`.
- `src/shell/app-sidebar.tsx` renders the navigation group, then one `SidebarGroup` labelled "Projects" with a
  `SidebarMenu` (`aria-label` "Projects") of links (status icon, truncated name, `min-h-touch-target md:min-h-row-height`,
  `aria-current="page"` on the open project); with no projects, the label and a muted "No projects watched yet" line.
- CT-30 gives `groupProjects(projects, groups, { collator })`, `createGroupCollator(locale)` and `loadProjectGroups()`;
  `findRepositories` already returns `groupId`. The Projects page (CT-32) is the reference caller.
- Theme 0.37: `SidebarGroupLabel` is a flex `div` (`h-8`, `text-xs`, muted) without truncation; `SidebarContent` is
  `flex-1 overflow-auto`, so a long list scrolls inside the sidebar and the footer stays in place (the phone risk).
- No unit test renders the sidebar today; tests run in the node environment (static markup, no DOM).

## e2e that read the sidebar's "Projects" list
- `e2e/overview.spec.ts` (status icons of kappa and mu), `e2e/watched-repositories.spec.ts` (alpha link, beta removed),
  `e2e/team.spec.ts` (the teammate sees the project). All use `example-org/*`, which no spec puts in a group, so they
  move to the sidebar's "No group" list.
- The sheet on a phone stays open after a link in it is pressed (today's behaviour, not changed here).
- On a project page the "Projects" navigation link is also active (`isActivePath` prefix match), so a test counts the
  active link among the project links only.

## Risks
- Shared e2e database: unique fictional owners (`maple-row`, `pine-yard`) and `example-org/sidebar-loose-app`; relative
  order only.
