# Research: project-page-tab-e2e-under-load

## What the failure shows
- The CI trace could not be fetched (the artifact's storage host is not reachable from the session); the job log's
  error context is the evidence: after the tab click the page kept the old document (Roadmaps tab not current) for the
  whole 5-second expect, and the log shows scans running back to back from other specs in those seconds.
- A tab is a plain `<a>` (theme-notion `TabBar`), so a click is a whole-document navigation. `openTab` then polls
  `aria-current` with the 5-second expect default: that budget covers the whole server render of the next document.

## Two causes, both reproduced or measured
1. **A scan-end refresh that fails cancels the click.** The header's `RefreshControl` (`src/shell/refresh-control.tsx`)
   polls `/api/scan-progress` on a page rendered while a scan runs and calls `router.refresh()` when it ends. Next 16
   (`fetch-server-response.js`) treats a failed or non-OK refresh answer as an MPA navigation and runs
   `location.replace(<current URL>)` (`app-router.js`, `HistoryUpdater`), which replaces the pending tab navigation
   with a reload of the page the test is leaving. Reproduced with a throwaway spec on `/scheduled`: progress answered
   "running" then "idle", the refresh's RSC request held 1.5 s then aborted, the tab document held 3 s: the browser
   ended on `/scheduled` (tab lost). The same flow with the refresh answered (before or after the click) ends on the tab.
   Under the CI load other specs' scans end every few seconds, so this page gets refreshes during its navigations.
2. **The 5-second expect is not the navigation's budget.** The whole-document render of the project page (inbox,
   reads, facts, routines, groups from the one PGlite database that the scans also write) shares two cores with four
   workers; the spec already gives the roadmap view 15 s for the same reason. The expect starts counting at the click.

## Decision
- The spec holds the header's scan refresh for every test (`holdScanRefresh`), as project-settings and project-groups
  do: no test here checks the header refresh, and header-refresh.spec covers it.
- `openTab` waits for the navigation itself: `page.waitForURL(<the tab's href>, { waitUntil: "load" })` (navigation
  timeout unlimited, so the test's 30-second budget bounds it), then asserts `aria-current` on the loaded document.
- The product keeps Next's behaviour: a refresh that fails reloads the page, which is the framework's recovery; a lost
  click needs a failed refresh during a navigation, rare outside a loaded test run. Not changed here.
