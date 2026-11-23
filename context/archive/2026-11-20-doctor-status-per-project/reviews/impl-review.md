# Implementation review: doctor-status-per-project

Scope: full · Date: 2026-11-23 · Commits: 240e008 · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓ (131);
integration: build ✓, e2e ✓ (19, on the tree of 240e008)

## Verdict
Ready. The scan's forge step reads the `context-doctor` check run on the main branch's head as portfolio does (codes
and counts from the `context-doctor failure codes` annotation) and, when the checks API is refused, the
`context-doctor` job of the runs at the head (Actions: read). The result is stored in `overview.forge_facts`
(migration overview/0002, last good value kept); a failing doctor adds the broken reason `doctor_failing`; the
overview chip shows "Doctor: N failures" (codes in the hint), "Doctor failing", OK, pending or no job.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | 1 |
| Scope | PASS | no project-page findings (CMP-10) |
| Progress honesty | PASS | 2.3 settled by four screenshots the run inspected (1280 and 390 px, light and dark) |
| Correctness | PASS | |
| Tests | WARNING | 2 |
| Data and migrations | PASS | additive columns with a default; rollback in the header |
| Security | PASS | read only; GETs within Actions read and, where granted, Checks read |
| Architecture and patterns | PASS | forge calls in `src/forge/runs.ts`, rule in `src/doctor/**` |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | SUGGESTION | Both phases landed in one commit (the e2e edits were staged with phase 1). | Accept: one small item; Progress cites the same SHA for both phases. |
| 2 | WARNING | The doctor tests were written beside the code, so none was seen red first. | Fixed after the fact: removing the jobs fallback makes 5 of 13 doctor tests fail; restored, green. |
| 3 | SUGGESTION | With a fine-grained token on a private repository the codes are never shown. | Filed upstream: SOFTURE/SKILLS#68; README names the limit. |

## Evidence
- `cockpit/evidence/doctor-status-per-project/01-overview-doctor-after-{1280,390}-{light,dark}.webp` (project files).
