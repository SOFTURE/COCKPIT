# Plan: scan-new-repository

## Approach
Two small changes. First, the overview counts a state as unreadable only when a read happened and did not end
`ok`; a project with no read yet takes the rest of the status rules (it has no numbers, so it is idle until its
first read). The digest and the MCP answers build on the overview, so they follow. Second, adding a repository
queues a run of the scan schedule, the same call "Scan now" makes, through one shared function, so the new
project is read within seconds instead of at the next period.

## Key decisions
- No new status for "not read yet": the row already says "never read", and with the scan queued on add the window
  lasts seconds. A new status would touch the status list, icons, copy and the digest for a transient state.
- A failure to queue the scan does not fail the add: the repository is stored and the next scheduled scan reads
  it; the failure is returned as a value and the action ignores it on purpose.

## Phase 1: Never-read is not broken, adding queues a scan

- Files: `src/overview/build-overview.ts`, `src/scan/queue-scan.ts` (new), `app/(app)/settings/actions.ts`,
  `app/(app)/scan-status/actions.ts`, `tests/overview/build-overview.test.ts`, `tests/scan/queue-scan.test.ts`
  (new), `CHANGELOG.md`.
- Mode: TDD.
- Done when: a unit test shows a never-read project is not broken (red before the fix); a test shows that after a
  repository is added and the scan is queued, one run of due jobs records its read; an existing test keeps a
  failed read broken; gates green; the pull request's CI is green before the merge. After the release, the thread checks
  that production shows a read for every watched repository and reports it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Never-read is not broken, adding queues a scan

#### Automated
- [x] 1.1 Overview test red on master: a never-read project is broken (state_unreadable) — 93da5c7
- [x] 1.2 Overview counts state_unreadable only after a failed read; test green; failed reads stay broken (epsilon-app no_state) — 93da5c7
- [x] 1.3 `queueScan` shared by "Scan now" and adding a repository; test: an added repository is read by the next due-jobs run, and stays unread without it (`tests/scan/queue-scan.test.ts`, 2/2) — 93da5c7
- [x] 1.4 Gates green: typecheck, lint (language scan), test (331/331), doctor — 93da5c7
