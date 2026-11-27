# Plan: project-page-tab-e2e-under-load

## Approach
Spec only (`e2e/project-page.spec.ts`): hold the header's scan refresh in every test of the file, and make `openTab`
wait for the tab's whole-document navigation (URL plus `load`) before it checks the current tab.

## Phases
### Phase 1: the spec waits for what a tab navigation costs (test-after)
- `e2e/project-page.spec.ts`: `test.beforeEach` calls `holdScanRefresh(page)`; `openTab` reads the tab's `href`,
  clicks, `page.waitForURL(href, { waitUntil: "load" })`, then expects `aria-current="page"`.
- Done when: typecheck and lint clean; `project-page.spec.ts` passes with `--repeat-each` under 4 workers; the full e2e
  passes with 2 and with 4 workers; CI green on the pull request and on master.

## Progress
- [x] Phase 1: typecheck and lint clean; full e2e with 2 workers 128 passed (4.3m); with 4 workers every
  project-page test passed, one unrelated failure in packages.spec (help tooltip closed by a scan-end refresh, filed as
  SOFTURE/COCKPIT#169); the cause reproduced with a throwaway spec (failed refresh during a tab navigation ends on the
  old page; an answered refresh does not)
