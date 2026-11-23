# Plan: project-page-roadmap-and-owner-items

## Goal
The project route becomes a page with the project's active roadmap items and their stages (roadmap order), queued
roadmaps with their start condition, open changes, the owner's entries for this project answerable as in the inbox,
and links to the repository; it says so when there is no state or no active roadmap, and shows the last good data
with the failure and its time when the last read failed (FR-10). Out of scope: history and doctor findings (CMP-10).

## Approach
**Starting point:** the route exists and shows only access facts; every datum is already stored by the scan.

**Chosen:** a pure builder `src/project-page/build-project-page.ts` turns the watched repository, its stored read and
its inbox rows into a view model (read failure, state sections, links); a server loader reads them; the page renders
sections with the theme's components and reuses `InboxRow` with `answerEntryAction`.
Rejected: a project-specific answer action (duplicates FR-5); storing a web URL per repository (a migration for a
value derivable from config).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Route | keep `projects/[owner]/[name]` | already linked from overview and sidebar | research |
| Web links | derived from `FORGE_API_URL` | no migration, works for the fake forge | research |
| Stage | `stage` else `status`, plus `detail` | the state's own words | state schema |
| Entries | inbox rows filtered by project | answer exactly as in the inbox | FR-10 |
| Branch for links | `main_branch` of the state, else the repository's default branch | the state names it | research |

## Phase 1: Project page model
**Discipline:** TDD (business rule). **Files:** `src/project-page/build-project-page.ts`,
`src/forge/web-url.ts`, `tests/project-page/build-project-page.test.ts`, `tests/forge/web-url.test.ts`.

**Tests:** five items keep their order with ID, outcome and stage (stage falls back to status); queued roadmap with
title and start condition; open changes; entries of this project only; no stored state; no active roadmap; last
read failed keeps the last good data with the failure and its time; links (repository, roadmap file, change folder,
queued roadmap) with the state's branch; web origin for github.com, an `/api/v3` base and another base.

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: The page
**Discipline:** test-after (UI). **Files:** `src/project-page/load-project-page.ts`, `src/project-page/*.tsx`,
`app/(app)/projects/[owner]/[name]/page.tsx`, `messages/en.ts` (`projectPage`; drop
`repositories.projectPlaceholder`), `e2e/fake-forge.ts` (a project page repository and one whose state read fails
after the first), `e2e/project-page.spec.ts`.

**Tests:** e2e: a project with five items, a queued roadmap, open changes and an entry shows them in order with
links; the entry is answered on the page and shows sent; a project without an active roadmap says so; a project
whose later read fails shows the last good items with the failure; the page fits 390 px without horizontal scroll.

**Done when:**
- Automated: the e2e passes; Gates green.
- Manual: the page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the
  run inspects, saved to the project files).

## Risks and rollback
- No migration and no new forge call; rollback is reverting the merge.

## Decisions (auto)
- Frame skipped (see change.md Notes).
- The route keeps `[owner]/[name]` instead of the roadmap's estimated `[slug]`.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Project page model

#### Automated
- [x] 1.1 Builder tests pass: order and stages, queued, open changes, entries, empty cases, read failure (with and without a last good state), links — f0433de
- [x] 1.2 Web origin tests pass — f0433de
- [x] 1.3 Gates green (typecheck, lint, test) — f0433de

### Phase 2: The page

#### Automated
- [x] 2.1 `e2e/project-page.spec.ts` passes: sections, links, answer on the page, no roadmap, read failure, 390 px — 0d803dd
- [x] 2.2 Gates green (typecheck, lint, test) — 0d803dd

#### Manual
- [x] 2.3 The page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspected, `cockpit/evidence/project-page-roadmap-and-owner-items/0{1,2}-*-after-{1280,390}-{light,dark}.webp`) — 0d803dd
