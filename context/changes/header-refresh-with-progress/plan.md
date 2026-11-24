# Plan: header-refresh-with-progress

## Approach
The scan reports its progress through the jobs package: `scanProjects` takes an optional `onProgress(done, total)`
called with 0 before the first project and after each one; the scan handler passes `reportProgress({ step:
"scan.projects", done, total })`. A server function `loadScanProgress` (`src/scan/scan-progress.ts`) reads the scan
queue: a running scan with its progress → `running`, a waiting one → `queued`, otherwise `idle`; it adds the newest
read time. A route `GET /api/scan-progress` (signed-in only) answers it as JSON with the time already formatted. A
client component `RefreshControl` (`src/shell/refresh-control.tsx`) starts from the layout's first read, queues a scan
with the existing `scanNowAction`, polls the route every second while a scan is queued or running, draws the spinner,
"N of M refreshed" and a `MiniProgress`, and calls `router.refresh()` once the scan ends. `AppShell` gets a header
bar (trip planner style) with the sidebar trigger on a phone on the left and the control on the right.

## Key decisions
- Progress from the jobs package (no migration, works across processes); the pure part
  (`toScanProgress(jobs, reads)`) is unit-tested.
- The button reuses "Scan now"'s action, so it joins a waiting scan instead of queueing a second one.
- Polling interval 1 s (the jobs package writes progress at most once a second); polling stops when idle.
- The last read time is the newest project read, shown as "Last read {time}"; "Not read yet" when nothing was read.
- Settings' "Refresh list" stays (it refreshes the token's repository list, a different read).

## Phase 1: Progress from the scan

- Files: `src/scan/scan-projects.ts`, `src/scan/scan-handler.ts`, `src/scan/scan-progress.ts`,
  `app/api/scan-progress/route.ts`, `tests/scan/scan-projects.test.ts`, `tests/scan/scan-progress.test.ts`.
- Mode: TDD for `onProgress` (0 of 3 … 3 of 3, also with a failing project) and `toScanProgress` (idle, queued,
  running with and without a progress yet, newest read time, no reads).
- Done when: the unit tests ran red then green.

## Phase 2: Header bar with the refresh control

- Files: `src/shell/app-shell.tsx`, `src/shell/refresh-control.tsx`, `app/(app)/layout.tsx`, `messages/en.ts`,
  `messages/pl.ts`, `e2e/header-refresh.spec.ts`, `CHANGELOG.md`.
- Mode: test-after (e2e on a production build).
- Done when: e2e presses "Refresh" in the header and sees the counter or the finished state, then "Last read";
  the 390 px page has no horizontal scroll; screenshots at 1280 and 390, light and dark, before and after, inspected and
  stored as evidence; gates (typecheck, lint, test), build and the full e2e green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Progress from the scan

#### Automated
- [ ] 1.1 `onProgress` and `toScanProgress` unit tests red, then green
- [ ] 1.2 Scan handler reports progress; `/api/scan-progress` answers the signed-in user only

### Phase 2: Header bar with the refresh control

#### Automated
- [ ] 2.1 Header bar and `RefreshControl` in the shell; copy in both dictionaries
- [ ] 2.2 e2e for the header refresh green; full suite on a production build green
- [ ] 2.3 Screenshots before/after, light/dark at 1280 and 390 inspected and stored
- [ ] 2.4 Gates green: typecheck, lint (language scan), test, doctor
