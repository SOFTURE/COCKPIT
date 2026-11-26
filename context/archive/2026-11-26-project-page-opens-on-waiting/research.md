# Research: project-page-opens-on-waiting

## How it works today
- `src/project-page/project-tabs.ts` builds the tab bar. The shown tab is `pickTab(keys, requested, fallback)` with
  `fallback = tabs.find(hasContent)?.key ?? "waiting"`; `hasContent` is true for `production` whenever the tab exists,
  and for Waiting, Roadmaps and Changes when their count is above 0. So a project with no entries opens on Roadmaps,
  Changes or Production (owner's screenshot, F-5).
- `src/shell/pick-tab.ts` returns the requested key when it is one of the available keys, otherwise the fallback.
- `app/(app)/projects/[owner]/[name]/page.tsx` renders the theme `TabBar` from `tabs.current`; nothing else decides
  the default.
- `tests/project-page/project-tabs.test.ts` pins the old default ("opens the first tab with something in it", and
  the fallback cases with `changes: 1`).

## e2e that open a project page without `?tab=`
- `e2e/deploy.spec.ts` and `e2e/health.spec.ts` open Production explicitly (`?tab=production`); their no-tab visits
  only assert that the Production tab is absent.
- `e2e/drift.spec.ts` asserts the drift notice, which sits above the tabs (page-level), so the default tab does not
  matter.
- `e2e/project-page.spec.ts` already expects Waiting for omicron-app (entries) and pi-app; `e2e/row-facts.spec.ts`
  expects the Waiting entries (project with entries). None relies on the old default.

## Fixtures
- The fake forge (`e2e/fake-forge.ts`) groups repositories per spec; specs share one database, so a new spec watches
  repositories no other spec uses. `createStateFixture` defaults to one active roadmap and one owner-queue entry.

## Decision
- The fallback becomes `"waiting"` always; `hasContent` goes. No SOFTURE package covers it (app-local tab rule).
