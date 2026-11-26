# Research: project-settings-tab

## How it works today (master b92aa7d)
- The project page `app/(app)/projects/[owner]/[name]/page.tsx` builds its tabs with `buildProjectTabs`
  (`src/project-page/project-tabs.ts`): Waiting, Roadmaps, Changes, Routines and Production (only when health or deploy
  reports). `pickTab` (`src/shell/pick-tab.ts`) shows the requested tab when it is in the list, otherwise Waiting (CT-29).
  Tab labels come from `messages.projectPage.tabs`, icons from `TAB_ICONS` (`satisfies Record<ProjectTabKey, …>`).
- CT-30 landed the groups: `findProjectGroups`/`setRepositoryGroup` in `modules/projects/groups.ts` (an unknown group
  is the value `projects.group_not_found` through the foreign key), `loadProjectGroups()` (server-only),
  `sortGroups`/`createGroupCollator` in `src/projects/group-projects.ts`, `parseGroupId` (zod) in
  `src/projects/project-group-input.ts`, and `WatchedRepository.groupId`.
- `setProjectGroupAction` already exists in `app/(app)/settings/actions.ts` (CT-30 D5) and nothing calls it yet. It
  checks the user, reads `repositoryKey` and `groupId` (empty = No group), returns `{ ok, message }`.
- Settings rows use the shared `SettingsRow` (`src/settings/settings-row.tsx`): title with a "?" field help holding the
  hint, the action on the right, always on one line (no phone stacking, no status slot).
- The Settings groups card has the id `project-groups-heading` (`src/projects/project-groups-section.tsx`).
- The theme `Select` (theme-notion 0.37.0, Radix) has `SelectTrigger size="touch"` (44 px) and `SelectSeparator`;
  `routine-forms.tsx` uses `size="touch" className="md:h-8"` for the phone/desktop split.
- No unit test mocks modules (`vi.mock` is unused); actions are tested through pure cores.

## What the change touches
- `project-tabs.ts` + its test, the project page, a new section and client select, a project-page action, messages,
  `SettingsRow` (optional status and phone stacking, backward compatible), a new e2e spec and one fake-forge repository.

## Findings
- The Projects page is not grouped before CT-32 (parallel). The e2e cannot "find the project under that group" there yet;
  Settings' group rows show each group's project count, which proves the move today. The Projects page check is CT-32's.
- `e2e/fixtures.ts` is CT-30's and only read afterwards; the spec's own repository goes into `e2e/fake-forge.ts` only.
- No e2e counts the project page's tabs by number (`grep "tab"` in `e2e/project-*.spec.ts` reads tabs by name).

## SOFTURE modules
- `@softure-ai/theme-notion` covers Select, FieldError, Card; `@softure-ai/auth/next` `requireUser`. Nothing missing.
