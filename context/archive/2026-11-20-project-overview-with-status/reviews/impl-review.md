# Implementation review: project-overview-with-status

Scope: full · Date: 2026-11-23 · Commits: b6218eb, 50356cb · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓ (87);
integration: build ✓, e2e ✓ (16, on the tree of 50356cb)

## Verdict
Ready after one fix (a test for the forge facts' foreign key). The scan reads two more forge answers per project
(latest release, main-branch workflow runs) and stores them in `overview.forge_facts`; `getProjectStatus` applies
the PRD's core rule in its order; `buildOverview` reproduces portfolio's numbers and groups the rows; `/projects`
shows them and the sidebar shows each status icon with its word.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | doctor shows n/a (CMP-7); no project page content (CMP-9) |
| Progress honesty | PASS | 2.3 settled by four screenshots the run inspected (1280 and 390 px, light and dark) |
| Correctness | PASS | |
| Tests | WARNING | 1, 2 |
| Data and migrations | PASS | own module and sequence; FK with cascade; rollback in the header |
| Security | PASS | read only; two GETs within Contents and Actions read the token already needs |
| Architecture and patterns | PASS | 3 |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | WARNING | Phase 1 was TDD but its tests were written beside the code, so no test was seen red before the rule existed. | Fixed after the fact: mutating the stall comparison (`>` to `>=`) makes the boundary test fail; restored, green. |
| 2 | WARNING | The `forge_facts` foreign key (leave with the repository, refuse an unknown one) had no test. | Fixed: `tests/overview/facts.test.ts`. |
| 3 | SUGGESTION | The layout now reads repositories and reads twice per page (inbox and overview). | Skipped: cheap indexed reads well inside NFR-1; one shared loader is a refactor of CMP-4's code. |
| 4 | SUGGESTION | `ForgeClient.getJson` is a new interface method; CMP-5's `tests/support/memory-forge.ts` implements the interface. | Accept: the second of CMP-5 and CMP-6 to merge adds the method to that fake (research, Collisions). |

## Decisions (auto)
- The sidebar shows the status as an icon whose word is its tooltip and screen-reader text: the row is too narrow
  for the word, the icon shapes differ per status, and the overview shows the word beside every icon (FR-8).
