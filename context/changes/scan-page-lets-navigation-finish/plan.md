# Plan: scan-page-lets-navigation-finish

## Approach
1. `ScanNowButton` waits only while the freshly rendered page says a scan is pending or running (`isScanning`); the
   server action already revalidates `/scan-status`, so the props after a press are fresh.
2. Refreshes are chained, not timed: the next refresh is scheduled 2 s after the previous one committed (tracked with
   `useTransition`), so a refresh never starts while another is pending, and a navigation that discarded a refresh is
   never overtaken by a new one.
3. Regression e2e: `e2e/scan-status-navigation.spec.ts`: after Scan now, with the `/projects` RSC answers delayed past
   the refresh interval, the sidebar link opens Projects. `e2e/header-refresh.spec.ts` (own database, no other spec
   queues scans there): once the scan is over Scan status sends at most the header's one reload in 6 s.

## Key decisions
- Keep the live refresh of Scan status (FR-3 rows appear as they are read) rather than polling a JSON endpoint: the
  chained refresh is the smallest change that removes the livelock.
- Delay the answers in the browser (Playwright route) instead of loading the server: deterministic, same mechanism.

## Phase 1: Fix and guard
- Files: `src/scan/scan-now-button.tsx`, `e2e/scan-status-navigation.spec.ts`, `e2e/header-refresh.spec.ts`,
  `e2e/press-scan-now.ts`, `CHANGELOG.md`.
- Mode: TDD: the new spec fails on the current code (navigation never arrives), passes after.
- Done when: the spec red before, green after; gates green; full e2e green with default workers and with 4 workers;
  PR CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Fix and guard

#### Automated
- [x] 1.1 New specs red on the current code (navigation never arrived in 12 s; 3 refreshes in 6 s, 2/2 runs), green with the fix
- [x] 1.2 Gates green: typecheck, lint, test 778/778
- [x] 1.3 Full e2e green 83/83: once with default workers, twice with 4 workers (a first 4-worker run caught the refresh-count spec on the shared database; moved to the refresh project's own database)
- [ ] 1.4 PR CI green (all jobs)
