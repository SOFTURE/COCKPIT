# Plan: sidebar-navigation-e2e-budget

## Approach
1. New e2e helper `e2e/open-from-sidebar.ts`: clicks a Main link, waits for the URL and the page's level-1 heading
   within `SIDEBAR_NAVIGATION_MS` (two server answers, each with the default 5-second answer budget), and asserts the
   click caused at most 3 non-prefetch RSC requests for that path (one navigation, not a chain of refreshes).
2. Use it at every sidebar click that waits for the next page: overview, packages, broadcast (twice), no-prefetch.
   scan-status-navigation keeps its own slowed-answer budget.
3. `project-groups.spec.ts:62` is left to CT-35 (PR #151), merged before this change.

## Key decisions
- Budget from the mechanism (two answers), guard from the request count: a slow server passes, a navigation that
  never settles or a refresh chain fails.

## Phase 1: Helper and call sites
- Files: `e2e/open-from-sidebar.ts`, `e2e/overview.spec.ts`, `e2e/packages.spec.ts`, `e2e/broadcast.spec.ts`,
  `e2e/no-prefetch.spec.ts` (test code only: no CHANGELOG entry).
- Mode: test-after (test code only).
- Done when: gates green; the touched specs green; full e2e green with default workers and with 4 workers. PR CI (all
  jobs) is the merge gate; master CI on the merge commit is read after the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Helper and call sites

#### Automated
- [x] 1.1 Gates green: typecheck, lint, unit tests 957/957 — 8018ad2
- [x] 1.2 Touched specs green — 8018ad2
- [x] 1.3 Full e2e green with default workers and with 4 workers (124/124 each) — 8018ad2
