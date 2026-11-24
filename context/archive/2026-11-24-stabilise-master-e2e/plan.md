# Plan: stabilise-master-e2e

## Approach
1. **CLI bug.** `src/status/project-status.ts` exports `BROKEN_REASONS`; the CLI's answer schema and the digest
   snapshot read it instead of their own literals, so a new reason cannot drift again. A CLI test with an unhealthy
   project fails before the fix and passes after.
2. **Scan race.** One e2e helper, `e2e/scan-until-settled.ts`, opens Scan status and presses Scan now until every named
   row shows what it expects (a read time by default), with the 10-second settle per press of FR-3. Every spec that
   pressed Scan now once uses it (`polish.spec.ts` keeps its own: its server and database are its alone).
3. **Read time.** `cli.spec.ts` compares the read time as "Read <time>" (another spec's scan may move it), reports
   code and stderr together so a failure names its cause, and its edge forwards on a fresh connection per request.
4. **Block it.** master requires the five `ci` checks (`gates`, `e2e`, `deploy-dry-run`, `cli-package`,
   `context-doctor`) with admins included, no force push, no deletion; AGENTS.md's CI rule says so.

## Key decisions
- Press Scan now again rather than wait for the scheduled scan: it is what a person does, and the package fix
  (SOFTURE/AI issue) removes the need.
- Required checks without "up to date with master": the failures were flaky tests, not combinations, and the
  workflow's merge rule (`remergeMain: when-needed`) stays as it is.

## Phase 1: Fix and guard

- Files: `src/status/project-status.ts`, `cli/answer-schemas.ts`, `src/digest/build-snapshot.ts`,
  `tests/cli/run-cli.test.ts`, `e2e/scan-until-settled.ts`, `e2e/*.spec.ts`, `AGENTS.md`, `CHANGELOG.md`.
- Mode: TDD for the CLI bug; the e2e changes are verified by repeated runs.
- Done when: the CLI test is red before and green after; gates green; the e2e green 3 times with the CI's worker count
  and green under 6 workers for the races fixed here; the pull request's CI green; master protected.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Fix and guard

#### Automated
- [x] 1.1 CLI unhealthy test red without the schema fix (1 failed, 12 passed), green with it (13/13) — 0d166a2
- [x] 1.2 Scan helper in every shared-database spec; e2e green 5/5 runs (59/59) with default workers — 0d166a2
- [x] 1.3 Under 6 workers the `cli.spec.ts` failures no longer reproduce (before: 2/2 runs red; after: 1 green, 1 red only on a 5-second Add timeout of the Polish server under that load, never seen on CI's 2 workers) — 0d166a2
- [x] 1.4 Gates green: typecheck, lint (language scan), test 441/441 — 0d166a2

#### Manual
- [ ] 1.5 master protected with the five required checks, admins included (owner only: the session's proxy refuses agents the branch protection API, `PUT /branches/master/protection` answered 403)
