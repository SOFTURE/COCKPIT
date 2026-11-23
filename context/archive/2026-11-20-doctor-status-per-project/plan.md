# Plan: doctor-status-per-project

## Goal
Each project's overview row shows the doctor result read from the `context-doctor` check run on the head of its
main branch: OK, failing with the number of failures (codes in the hint), pending, or missing (no such job); a
failing doctor makes the project broken. Out of scope: doctor findings on the project page (CMP-10).

## Approach
**Starting point:** the scan stores release and runs per project (CMP-6); the overview shows "Doctor n/a".

**Chosen:** the scan's forge step reads the check run as portfolio does (checks API, then the codes annotation);
when the checks API is refused (a fine-grained token on a private repository), it falls back to the jobs of the
runs at the main branch's head (Actions: read) for the status, without codes. The result is stored in
`overview.forge_facts` and turned into a row field and a broken reason.
Rejected: requiring a "Checks" permission (a fine-grained token cannot hold it); reading job logs for the codes
(fragile text parsing).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Read path | checks API first, Actions jobs on refusal | portfolio parity; works with NFR-5's token | research |
| Codes | annotation `context-doctor failure codes`, code and count | outcome shows the number of failures | doctor.py |
| Unknown codes | "failing" without a count on the fallback path | annotations need Checks | research |
| Storage | migration `overview/0002` adds `doctor`, `doctor_status` | facts beside release and runs | research |
| Status | `doctor_failing` broken reason | FR-8 | roadmap |
| Head commit | head sha of the newest run on the branch (fallback only) | no extra call | research |

## Phase 1: Doctor read, storage and status
**Discipline:** TDD (business rule). **Files:** `src/forge/runs.ts` (head sha and run id, check runs, jobs,
annotations), `src/doctor/read-doctor.ts`, `src/doctor/parse-failure-codes.ts`, `src/scan/forge-facts.ts`,
`modules/overview/**` (migration `0002_add_doctor_to_forge_facts.sql`, facts), `src/status/project-status.ts`,
`src/overview/build-overview.ts`, `tests/**` (`fake-forge-routes.ts` gets a `doctor` answer; every scan test passes
it).

**Tests:** `tests/doctor/read-doctor.test.ts` (passing, failing with codes and counts, pending, missing, newest of
several, refused → jobs fallback with and without the job, rate limit, annotations unreadable),
`tests/doctor/parse-failure-codes.test.ts` (empty, one, several, malformed parts), status test (`doctor_failing`,
precedence), overview test (row field, broken), facts test (doctor kept on a failed read), scan test (stored).

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Doctor chip in the overview
**Discipline:** test-after (UI). **Files:** `src/overview/overview-row.tsx`, `messages/en.ts` (`overview.doctor*`),
`e2e/fake-forge.ts`, `e2e/overview.spec.ts`.

**Tests:** e2e: fake-forge projects with a failing (codes), a passing, a pending and no `context-doctor` check run
show "Doctor: 3 failures", "Doctor OK", "Doctor pending" and "Doctor: no context-doctor job"; the failing one is
broken with its reason.

**Done when:**
- Automated: the e2e passes; Gates green.
- Manual: the chips render on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots
  the run inspects).

## Risks and rollback
- Up to three extra GETs per project per scan on the fallback path; NFR-2's budget stays far away.
- Rollback: revert the merge; `ALTER TABLE overview.forge_facts DROP COLUMN doctor, DROP COLUMN doctor_status;`
  and delete the `softure.migrations` row (see the migration header).

## Decisions (auto)
- A migration in module `overview` although the roadmap estimated none (facts need a column; lane A is done).
- Fallback through Actions jobs instead of asking for a Checks permission no fine-grained token can hold.
- Codes keep their counts (portfolio keeps only codes) so the row shows the number of failures.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Doctor read, storage and status

#### Automated
- [x] 1.1 Doctor tests pass: each result, newest run, fallback, rate limit, codes parsing — 240e008
- [x] 1.2 Status, overview, facts and scan tests pass with the doctor — 240e008
- [x] 1.3 Gates green (typecheck, lint, test) — 240e008

### Phase 2: Doctor chip in the overview

#### Automated
- [x] 2.1 `e2e/overview.spec.ts` passes: failing with count, OK, pending, missing; failing is broken — 240e008
- [x] 2.2 Gates green (typecheck, lint, test) — 240e008

#### Manual
- [x] 2.3 Chips render on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspects, `cockpit/evidence/doctor-status-per-project/01-overview-doctor-after-*.webp`) — 240e008
