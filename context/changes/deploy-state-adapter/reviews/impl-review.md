# Implementation review: deploy-state-adapter

Scope: full · Date: 2026-11-23 · Commits: c2583ee, 93687c5, the review fix below · Gates: typecheck ✓, lint ✓
(ESLint + language), test ✓ (247); integration: build ✓, e2e ✓ (29, on the tree of 93687c5)

## Verdict
Ready. `src/adapters/deploy/` adds the second adapter on CMP-21's contract (id `deploy`, no migration): it reads the
runs of the project's `.github/workflows/deploy.yml` and, when there are any, the deployment rows the release report
of `@softure-ai/deploy` keeps in the GitHub Releases. The project page shows "In production: <tag>" (the newest
deployed production row, or the newest passed release run), the last deploy (passed, failed at <step>, cancelled,
running) with its version, its verification and a link to the run; a source that fails shows "Deploy state unknown"
with the reason; a project without the workflow, or whose workflow never ran, shows nothing extra.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | none |
| Scope | PASS | overview, status and digest unchanged; compose and deploy files untouched (CMP-23) |
| Progress honesty | PASS | 2.3 settled by four screenshots the run inspected (1280 and 390 px, light and dark) |
| Correctness | PASS | 1 (fixed) |
| Tests | PASS | parser tested against a body the package's CLI wrote |
| Data and migrations | PASS | no schema change; rows in `adapters.reads` with adapter `deploy` |
| Security | PASS | read only toward repositories; no server access; run links restricted to http(s) |
| Architecture and patterns | PASS | mirrors the observability adapter (state schema, view, loader, page section) |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | WARNING | The run's `html_url` from the forge becomes an `href` on the page; a non-web scheme would be a script link. | Fixed: the runs schema accepts only `http(s)` URLs, otherwise the read is unknown `runs_invalid` (tested). |
| 2 | SUGGESTION | The MCP `get_project` tool does not carry the deploy state. | Recorded: outside FR-17's acceptance (the page); a follow-up when an assistant needs it. |
