# Implementation review: project-page-roadmap-and-owner-items

Scope: full · Date: 2026-11-23 · Commits: f0433de, 0d803dd · Gates: typecheck ✓, lint ✓ (ESLint + language),
test ✓ (156); integration: build ✓, e2e ✓ (23, on the tree of 0d803dd)

## Verdict
Ready. The project route shows the last good read of the project's `context/state.json`: active roadmap items in
roadmap order with ID, outcome, stage (status when no stage), detail and the change folder while the change is
open; queued roadmaps with their start condition and file; open changes with stage, item and folder; the owner's
entries of this project rendered and answered by the inbox's own row and action; links into the repository from a
web origin derived from `FORGE_API_URL`. No state, no active roadmap, nothing queued, no change and no entry each
say so; a failed read shows the failure word, its reason and time, and the last good data below it.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | 1 |
| Scope | PASS | no history or doctor findings (CMP-10) |
| Progress honesty | PASS | 2.3 settled by eight screenshots the run inspected (1280 and 390 px, light and dark, a full page and a failed read) |
| Correctness | PASS | 2 |
| Tests | PASS | |
| Security | PASS | no new write; answers go through `answerEntryAction` (`tests/forge/no-other-writes.test.ts` unchanged) |
| Language | PASS | copy in `messages/en.ts` → `projectPage` |

## Findings
| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | INFO | The route stays `projects/[owner]/[name]` (the roadmap estimated `[slug]`). | Accept: overview and sidebar already link there; recorded under Decisions (auto). |
| 2 | WARNING | Settings' access check said "Readable" next to a failed read, which contradicted the failure. | Fixed in 0d803dd: the access status shows only when a permission is missing. |
| 3 | SUGGESTION | The e2e fake forge refuses pi-app's state after two reads; a third read path (a new probe) would shift that count. | Accept: the comment names both reads; the spec checks the scan's own "Not readable" first. |
