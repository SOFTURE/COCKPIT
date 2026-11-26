# Plan: project-page-opens-on-waiting

## Approach
`buildProjectTabs` falls back to Waiting whenever the address carries no available tab; the rest of the tab bar is
unchanged. Unit tests cover every data combination; a new e2e spec opens three new fictional projects without `?tab=`
(production only, roadmaps and changes only, entries) at 1280 and 390 px and asserts Czeka/Waiting is current with its
panel shown, then `?tab=production` still opens Production. Evidence screenshots before and after.

## Phases
### Phase 1: Waiting is the default (TDD)
- `tests/project-page/project-tabs.test.ts`: "opens the first tab..." becomes "opens Waiting whatever the other tabs
  hold" (no data; entries; roadmaps; changes; routines; production; everything with 0 entries); requested of each
  available tab gives it; `production` unavailable and unknown/empty keys give `waiting`.
- `src/project-page/project-tabs.ts`: fallback `"waiting"`, drop `hasContent`, update the doc comment.
- Done when: the unit test fails before the change and passes after; typecheck, lint, `npm test` clean.

### Phase 2: e2e and evidence (test-after)
- `e2e/fake-forge.ts`: `DEFAULT_TAB_REPOSITORIES` with `example-org/tab-production-app` (deploy run + release, no
  entries, no roadmap or changes), `example-org/tab-work-app` (active roadmap and an open change, no entries),
  `example-org/tab-entries-app` (one entry, deploy).
- `e2e/project-default-tab.spec.ts`: watch, scan, open each without `?tab=` at 1280 and 390 px; assert
  `data-tab="waiting"` has `aria-current="page"`, the URL has no `?tab=`, and the Waiting region is shown (empty state
  for the two without entries); `?tab=production` opens Production. `captureEvidence` of the page (production
  project) for before/after screenshots.
- Done when: the new spec and the project-page, deploy, health, drift, row-facts specs pass locally; the full e2e
  passes in CI; screenshots inspected and stored under the project files' `cockpit/evidence/project-page-opens-on-waiting/`.

## Progress
- [x] Phase 1: Waiting is the default; the new unit cases failed (2 of 8) before the fix and pass after; `npm test`:
  778 passed; typecheck and lint clean.
- [x] Phase 2: e2e and evidence; `e2e/project-default-tab.spec.ts` fails on master code (Production current, the bug)
  and passes with the fix; `npx playwright test --workers=4`: 87 passed (1.7m), local. Screenshots inspected: before
  shows Production current with the deploy panel (the owner's screenshot), after shows Waiting current with "Nothing in
  this project waits for you." at 1280 and 390 px, light and dark: project files cockpit/evidence/project-page-opens-on-waiting/01-project-page-without-tab-{before,after}-{1280,390}-{light,dark}.webp.
