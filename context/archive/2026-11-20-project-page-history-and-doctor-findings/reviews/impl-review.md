# Implementation review: project-page-history-and-doctor-findings

Scope: full · Date: 2026-11-23 · Commits: d9725af, 9ad60a8 · Gates: typecheck ✓, lint ✓ (ESLint + language),
test ✓ (171); integration: build ✓, e2e ✓ (26, on the tree of 9ad60a8)

## Verdict
Ready. A watched project's page links to its history (`/projects/<owner>/<name>/history`), which reads the forge when
opened, the four reads in parallel: the latest ten merged pull requests on the main branch, the latest five published
releases (drafts left out, prereleases marked), the latest five CI and five quality-review runs with result, date and
link, and the doctor's findings from the `context-doctor` check run's per-failure annotations with code, file and
message, plus how many more the run counted than the forge lists. A read that fails shows its reason (and the
permission the forge names; Checks: read is explained) in its own block while the others load. The scan is unchanged,
so NFR-2 holds as before.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | 1 |
| Scope | PASS | no change to the scan, the overview or the stored facts |
| Progress honesty | PASS | 2.3 settled by eight screenshots the run inspected (1280 and 390 px, light and dark, a full history and refused blocks) |
| Correctness | PASS | 2, 3 |
| Tests | PASS | |
| Security | PASS | only GET reads through `getJson`; `tests/forge/no-other-writes.test.ts` unchanged and green |
| Language | PASS | copy in `messages/en.ts` → `projectHistory`, `projectPage.openHistory` |

## Findings
| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | INFO | The route is `projects/[owner]/[name]/history` (the roadmap estimated `[slug]/history`). | Accept: the project route is `[owner]/[name]` since CMP-9; recorded under Decisions (auto). |
| 2 | SUGGESTION | Merges come from one page of 50 closed pull requests; many pull requests closed unmerged could leave fewer than ten merges shown. | Accept: the block says "latest"; a second page would double the cost of every open for a rare case. |
| 3 | SUGGESTION | The history reads the repository's default branch, not the state's `main_branch`. | Accept: the scan reads the same branch (`scan-projects.ts`), so the history and the overview agree. |
