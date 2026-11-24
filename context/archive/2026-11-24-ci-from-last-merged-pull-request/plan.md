# Plan: ci-from-last-merged-pull-request

## Approach
1. Forge: `ForgeMerge.headSha`; `getHeadRuns(client, { owner, name, sha })`; `isPullRequestCiRun` (every run but the
   quality review and the deploy); `summarizePullRequestCi(runs)` (completed runs, newest per workflow, failed if any
   failed, else cancelled if any cancelled, else passed; url of the failed run or the newest; at = newest change).
2. Scan: `readForgeFacts` keeps the main branch CI when there is one; otherwise `findLastMergedCi` reads the last
   merge and its head runs and stores `{ ...summary, pullRequest: { number, url } }`. A rate limit stops the scan as
   today; another failed read keeps `ci: null` (shown as none).
3. Overview: `OverviewRun` of kind `run` gains `pullRequest: { number, url } | null`; `describeRunSource` words it
   ("from PR #N"); the chip links it to the pull request; the terminal appends it; the CLI schema accepts it; the MCP
   answer carries it as is.
4. History tab: with no main-branch CI run, the CI list shows the last merged pull request's head runs, headed by
   "From PR #N" linked to the pull request.

## Key decisions
- No migration: the source travels inside the stored jsonb run.
- A failed CI from a pull request still marks the project broken, labelled with its source (the item's Risk).

## Phase 1: CI from the last merged pull request

- Files: `src/forge/merges.ts`, `src/forge/runs.ts`, `src/scan/forge-facts.ts`, `src/overview/build-overview.ts`,
  `src/overview/describe-overview-row.ts`, `src/overview/overview-row.tsx`, `cli/answer-schemas.ts`,
  `cli/render-views.ts`, `src/project-page/history/build-history.ts`, `src/project-page/history/read-history.ts`,
  `src/project-page/history/history-sections.tsx`, `messages/en.ts`, `messages/pl.ts`, tests under `tests/forge`,
  `tests/scan`, `tests/overview`, `tests/project-page`, `e2e/fake-forge.ts`, `e2e/overview.spec.ts`,
  `e2e/mcp.spec.ts`, `CHANGELOG.md`.
- Mode: TDD for the forge and scan logic; test-after for the wording.
- Done when: unit tests cover main-branch CI kept, pull request fallback (passed, failed, deploy and quality review
  ignored, rerun newest wins), no merge, no head sha, rate limit; the e2e shows "from PR #N" on the overview and over
  MCP for a fixture project with runs only on pull requests, and a main-branch project unchanged; gates and full e2e
  green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: CI from the last merged pull request

#### Automated
- [x] 1.1 Unit tests for the forge reads and the pull request CI summary (merges head sha; counted workflows; failed, passed, cancelled, rerun, deploy and quality review ignored) — b7717e0
- [x] 1.2 Unit tests for the scan fallback and the overview row (pull request CI stored with its source, main-branch CI kept, no runs at the head, rate limit; old stored rows; wording en/pl) — b7717e0
- [x] 1.3 e2e: overview chip and MCP answer show the pull request source; history tab shows it (`e2e/ci-from-pull-request.spec.ts`); evidence `cockpit/evidence/ci-from-last-merged-pull-request/` (overview and history, 1280 and 390, light and dark, inspected) — b7717e0
- [x] 1.4 Gates green: typecheck, lint (language scan), test 544/544 — b7717e0
- [x] 1.5 Full e2e green locally: 65/65; the pull request's CI is the merge gate — b7717e0
