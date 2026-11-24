# Implementation review: context-drift-against-forge-flagged

Scope: full · Date: 2026-11-24 · Commits: cdcc306 · Gates: typecheck ✓ lint ✓ test ✓ (461/461) e2e ✓ doctor ✓

## Verdict
Ready. `findContextDrift` narrows the stored state and the stored forge release and returns `release_not_settled`
(rows `done_code` waiting for a release whose day is before the release's day; undated rows take the owner queue's
`release:` word date) and `finished_roadmap_live` (every row done, dropped or carried, at least one done). The
overview row draws an orange chip per drift next to the status with the detail and the settle step as its hint; the
project page shows a notice above the tabs naming each drift and the step (`wt-roadmap.py released <tag>`, or
closing the roadmap with `softure-roadmap`). The project's status is unchanged.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | no migration, no new forge read, no MCP or CLI field |
| Progress honesty | PASS | unit tests ran red (module missing) before the function existed |
| Correctness | PASS | screenshots light/dark at 1280 and 390 inspected |
| Tests | PASS | settled, released-not-settled, partial, same day, undated with and without the release word, owner-waiting rows, no or undated release, finished, waiting-only, empty and dropped-only roadmaps, unreadable input; overview baseline of two flags and one clean row |
| Security | PASS | reads only; stored JSON narrowed with zod |

## Findings
- Suggestion: drift is not in the MCP answers or the digest. The item's outcome names the overview and the project
  page only; left for a later item if the owner wants it there.

## Decisions (auto)
- A release on the same day as the rows is not drift (day-precise dates; the release may predate the merge).
- Drift does not change the status: it is a chore the project's session settles, not a failure.
