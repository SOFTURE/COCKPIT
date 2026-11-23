# Plan: project-page-history-and-doctor-findings

## Goal
A project's history page shows its latest ten merges, latest five releases, latest CI and quality-review runs with
dates and links, and the doctor's findings with their codes and the files they name; a block whose forge read fails
shows the reason while the others load (FR-11). The scan is unchanged, so NFR-2 holds as before.

## Approach
**Starting point:** the scan stores only summaries; the forge reads for runs, releases and the doctor exist.

**Chosen:** a history route `projects/[owner]/[name]/history`, linked from the project page, that reads the forge
when opened. `src/forge/merges.ts` lists merged pull requests, `src/forge/releases.ts` gains a release list,
`src/project-page/history/read-history.ts` runs the four reads and `build-history.ts` turns their answers into
blocks, each `{ status: "ok", ... } | { status: "failed", reason }`.
Rejected: storing history in the scan (a migration and more requests per scan for data seen only on open).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| When to read | on open, per request | blocks fail on their own; scan unchanged (NFR-2) | research |
| Merges | merged pull requests on the main branch | Pull requests: read is already granted | research |
| Runs shown | latest 5 CI and latest 5 quality review | "latest runs" with history, one read | FR-11 |
| Doctor findings | per-failure annotations of `context-doctor` | the doctor writes one per failure | doctor.py |
| Route | `projects/[owner]/[name]/history` | the project route is `[owner]/[name]` (CMP-9) | research |

## Phase 1: Forge reads and the history model
**Discipline:** TDD (business rule). **Files:** `src/forge/merges.ts`, `src/forge/releases.ts`, `src/forge/runs.ts`
(annotation `path`), `src/project-page/history/read-history.ts`, `src/project-page/history/build-history.ts`,
`tests/forge/merges.test.ts`, `tests/forge/releases.test.ts`, `tests/project-page/history.test.ts`.

**Tests:** merges keep only merged pull requests, newest merge first, at most ten; releases drop drafts, newest
first, at most five, prerelease marked; runs: latest five CI and five quality-review runs with result and date;
doctor: failing run lists each finding with code, file and message and the total from the summary, passing,
pending and missing say so; each refused, missing or failed read becomes that block's reason (permission named)
while the others load; no forge client → every block says the forge is not configured.

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: The history page
**Discipline:** test-after (UI). **Files:** `app/(app)/projects/[owner]/[name]/history/page.tsx`,
`src/project-page/history/history-sections.tsx`, `src/project-page/history/load-history.ts`,
`app/(app)/projects/[owner]/[name]/page.tsx` (link), `messages/en.ts` (`projectHistory`, `projectPage.openHistory`),
`e2e/fake-forge.ts` (pulls, releases, a failing doctor with findings, one refused block),
`e2e/project-history.spec.ts`.

**Tests:** e2e: the project page links to the history; a fixture project shows ten merges, five releases, CI and
quality-review runs with dates and links and doctor findings with code and file; a project whose release read is
refused shows the reason in that block and the other blocks load; the page fits 390 px without horizontal scroll.

**Done when:**
- Automated: the e2e passes; Gates green.
- Manual: the page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the
  run inspects, saved to the project files).

## Risks and rollback
- No migration and no new write; rollback is reverting the merge.

## Decisions (auto)
- Frame skipped (see change.md Notes).
- History is read on open instead of by the scan, so NFR-2's scan cost is unchanged.
- The route is `projects/[owner]/[name]/history` instead of the roadmap's estimated `[slug]/history`.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Forge reads and the history model

#### Automated
- [x] 1.1 Merges and releases list tests pass — d9725af
- [x] 1.2 History tests pass: runs, doctor findings, each failed block with its reason, no forge client — d9725af
- [x] 1.3 Gates green (typecheck, lint, test) — d9725af

### Phase 2: The history page

#### Automated
- [x] 2.1 `e2e/project-history.spec.ts` passes: link, merges, releases, runs, findings, a refused block, 390 px — 9ad60a8
- [x] 2.2 Gates green (typecheck, lint, test) — 9ad60a8

#### Manual
- [x] 2.3 The page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspected, `cockpit/evidence/project-page-history-and-doctor-findings/0{1,2}-*-after-{1280,390}-{light,dark}.webp`) — 9ad60a8
