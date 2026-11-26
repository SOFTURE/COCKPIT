# Plan: project-settings-tab

## Approach
`buildProjectTabs` gains a `settings` tab, last, no counter, never the default. The project page renders a
`ProjectSettingsSection` (server) with one `SettingsRow` holding `ProjectGroupSelect` (client, theme `Select`). The
select calls a project-page server action that delegates to a testable core `setProjectGroup` (signed-in check
injected), saves at once, shows "Saved" through an `aria-live` status, and reverts with a `FieldError` on failure.

## Key decisions (auto)
- D1: The action moves from `app/(app)/settings/actions.ts` (unused there) to `app/(app)/projects/[owner]/[name]/actions.ts`
  (the roadmap's place); its logic lives in `src/project-page/set-project-group.ts` with `requireUser` and the database
  injected, so the signed-in check, the unknown group and No group are unit-tested without module mocks.
- D2: The shared `SettingsRow` gains two optional props: `status` (a muted, polite live text after the title) and
  `stackOnPhone` (the control under the title, full width, below `md`). Existing rows are unchanged; the standard stays
  one component (owner's rule F-2).
- D3: The select's value is the group id as text, `"none"` for No group (Radix forbids an empty item value); the action
  receives `groupId` empty for No group.
- D4: Options: groups in `sortGroups` order (the same order `groupProjects` gives), a separator, No group. A project
  whose stored group no longer exists shows No group.
- D5: e2e proves the move on Settings' group counts (the Projects page is grouped by CT-32); fictional repository
  `example-org/grouping-app` added to the fake forge only.

## Phase 1: Tabs (TDD)
- `project-tabs.ts`: key `settings`, last, `count: undefined`; test: last with and without Production, never default,
  `requested: "settings"` opens it.
- Done when: `tests/project-page/project-tabs.test.ts` green.

## Phase 2: Action core (TDD)
- `src/project-page/set-project-group.ts` + `tests/project-page/set-project-group.test.ts` (PGlite): signed-in check runs
  first and nothing is written when it throws; a group id saves; empty is No group; unknown group is a value with the
  not-found message; a malformed id is refused.
- Done when: the test is green.

## Phase 3: UI
- `SettingsRow` props, `project-group-select.tsx`, `project-settings-section.tsx`, the page panel and icon, messages en/pl
  (`projectSettings` block + `projectPage.tabs.settings`), markup test for the select's options and order.
- Done when: gates green (typecheck, lint, test).

## Phase 4: e2e and evidence
- `e2e/project-settings.spec.ts` at 1280 and 390: open `?tab=settings`, pick a group, "Saved", the group's count on
  Settings rises; pick No group, it drops; select 44 px on a phone; screenshots closed/open × 1280/390 × light/dark.
- Done when: full e2e green locally, screenshots looked at.

## Merge
Every CI job green before the merge; master CI read on the merge commit after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Tabs

#### Automated
- [x] 1.1 `buildProjectTabs` gives `settings` last, never the default, opens on request — 01ebbb1 (`tests/project-page/project-tabs.test.ts` 9/9)

### Phase 2: Action core

#### Automated
- [x] 2.1 `setProjectGroup` tests: signed-in first, saves, No group, unknown group as a value, malformed id — 01ebbb1 (`tests/project-page/set-project-group.test.ts` 5/5)

### Phase 3: UI

#### Automated
- [x] 3.1 Select markup test: options in group order, separator, No group, current selected — 01ebbb1 (`tests/project-page/project-settings-section.test.tsx` 6/6)
- [x] 3.2 Gates green: typecheck, lint, test — 01ebbb1 (unit 838/838)

### Phase 4: e2e and evidence

#### Automated
- [x] 4.1 `e2e/project-settings.spec.ts` green at 1280 and 390; full e2e green locally — 6033495 (spec 2/2 three runs in a row; full e2e 104/104)
- [x] 4.2 Screenshots (closed and open select × 1280/390 × light/dark) saved and looked at — /mnt/project-files/cockpit/evidence/project-settings-tab/ (8 files, 01-settings-tab, 02-settings-tab-open)
