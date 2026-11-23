# Plan: project-overview-with-status

## Goal
The owner opens Projects and sees one row per watched project, grouped by status (broken, waiting for you, stalled,
moving, idle): active roadmap X/N and title, queued roadmaps, open changes, waiting count, last release with date,
doctor (n/a until CMP-7), last CI, last quality review with date, last read; each project in the sidebar shows its
status icon. Out of scope: the doctor reading (CMP-7), the project page (CMP-9).

## Approach
**Starting point:** the scan stores state and issues per project (CMP-3); the inbox counts unanswered entries (CMP-4).

**Chosen:** the scan also reads the latest release and the main branch's workflow runs and stores them per project
(`overview.forge_facts`); a pure `buildOverview` turns reads, facts and answers into rows with a status; the Projects
page renders the groups and the layout passes each project's status icon to the sidebar.
Rejected: reading the forge when the page opens (NFR-1, budget); storing facts in the state document (research).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Where | `/projects` is the overview | the shell's Projects destination is its natural home, no new nav item | research |
| Storage | module `overview`, table `forge_facts` | no collision with CMP-5's `projects` migration | research |
| CI / quality review | fixed workflow names (`ci`, `quality-review*`) from one runs call | packages' names, one GET | research |
| Release | forge latest release, else `state.last_release` (roadmap) | portfolio parity | portfolio.py |
| Waiting count | `len(owner_queue)`; status uses unanswered entries | parity + PRD rule | PRD |
| Open work | open roadmap items or open changes | no project without a status | research |
| Facts on failure | a failed fact read keeps the last good value | like the state read (FR-3) | research |
| Never read | broken (state cannot be read yet) | PRD rule | PRD |

## Phase 1: Forge facts in the scan and the status rule
**Discipline:** TDD (business rule). **Files:** `src/forge/client.ts` (generic `getJson`), `src/forge/releases.ts`,
`src/forge/runs.ts`, `modules/overview/**` (module, migration `0001_create_forge_facts.sql`, queries),
`softure.config.ts`, `src/scan/forge-facts.ts`, `src/scan/scan-projects.ts`, `src/status/project-status.ts`,
`src/overview/build-overview.ts`, `tests/**`.

1. `getJson(path, schema)` on the client; `getLatestRelease` and `getMainBranchRuns` build on it.
2. `readForgeFacts` picks the last completed CI run and the last quality-review run; the scan stores them after the
   issues (a rate limit stops the scan as before; any other failure keeps the last good facts).
3. `getProjectStatus` (pure) and `buildOverview` (pure): rows, groups in status order, sidebar statuses.

**Tests:** `tests/status/project-status.test.ts` (a fixture per status, precedence when several apply, 48 h
boundary), `tests/overview/build-overview.test.ts` (values equal a portfolio `--json` fixture of the same fictional
projects; release fallback; no active roadmap; grouping; 30 projects / 200 entries fast), `tests/forge/runs.test.ts`
(CI and quality-review picking), scan tests (facts stored, kept on failure, rate limit stops).

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Overview screen and sidebar icons
**Discipline:** test-after (UI). **Files:** `app/(app)/projects/page.tsx`, `app/(app)/layout.tsx`,
`src/overview/**` (load, row, status badge), `src/shell/sidebar-projects` icon via `SidebarProject.statusIcon`,
`messages/en.ts` (`overview` keys), `e2e/overview.spec.ts`, `e2e/fake-forge.ts`.

**Tests:** e2e: after a scan, fictional projects show broken (failed CI), waiting, moving and idle in their groups with
their numbers; the sidebar shows a status icon with its word; no horizontal scroll at 390 px.

**Done when:**
- Automated: the e2e passes; Gates green.
- Manual: the overview renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots
  the run inspects).

## Risks and rollback
- A watched project without a `ci` workflow shows CI "none" and cannot be broken by CI; documented in the copy.
- Rollback: revert the merge; the `overview` table is dropped with `DROP SCHEMA overview CASCADE` and its
  `softure.migrations` row (see the migration header).

## Decisions (auto)
- Overview at `/projects` instead of a new `/overview` route.
- Module `overview` with its own migration instead of "no migration" (collision with CMP-5 avoided).
- Fixed workflow names for CI and quality review.
- Open work includes open changes; never-read projects are broken.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Forge facts in the scan and the status rule

#### Automated
- [x] 1.1 Status tests pass: each of the five statuses, precedence, 48 h boundary — b6218eb
- [x] 1.2 Overview tests pass: portfolio parity, release fallback, no active roadmap, grouping, fast — b6218eb
- [x] 1.3 Forge and scan tests pass: CI and quality-review picking, facts stored and kept on failure — b6218eb
- [x] 1.4 Gates green (typecheck, lint, test) — b6218eb

### Phase 2: Overview screen and sidebar icons

#### Automated
- [x] 2.1 `e2e/overview.spec.ts` passes: groups, numbers, sidebar icon with its word, no horizontal scroll at 390 px — 50356cb
- [x] 2.2 Gates green (typecheck, lint, test) — 50356cb

#### Manual
- [x] 2.3 Overview renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspects) — 50356cb
