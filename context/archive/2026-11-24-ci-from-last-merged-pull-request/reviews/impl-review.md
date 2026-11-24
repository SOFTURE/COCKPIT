# Implementation review: ci-from-last-merged-pull-request

Scope: full · Date: 2026-11-24 · Commits: b7717e0 · Gates: typecheck ✓ lint ✓ test ✓ (544/544) e2e ✓ (65/65)

## Verdict
Ready. The scan keeps a main-branch CI run when there is one; without one it reads the last merged pull request
(`/pulls`, one page) and that pull request's head runs (`/actions/runs?head_sha=`, Actions read only) and stores the
result with `pullRequest: { number, url }` inside the existing jsonb column (no migration; rows stored before parse as
main-branch runs). The overview chip links the run and the pull request ("from PR #12"), a failed one names the pull
request in the broken reason, the history tab heads the CI list with the pull request, and the MCP overview and the
terminal carry the same source.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | forge reads, scan, overview, history tab, CLI schema and wording, own message keys |
| Progress honesty | PASS | every item has its command and result |
| Correctness | PASS | screenshots light/dark at 1280 and 390 inspected |
| Tests | PASS | rerun, cancelled, deploy and quality review ignored, no merge, empty head, rate limit, old rows |
| Security | PASS | reads only, no new permission (NFR-7) |

## Findings
- Suggestion: the digest still words a failed CI as "on its main branch" when it comes from a pull request. Left as
  is: the digest's wording is outside this item's files; the overview and MCP carry the source.

## Decisions (auto)
- The history tab stands for "the project page": it is the only part of the project page that shows CI.
