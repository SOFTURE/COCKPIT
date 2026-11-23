# Implementation review: owner-adds-watched-repositories

Scope: full · Date: 2026-11-23 · Commits: 36f1f26, fba5aed · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓ (36); integration: build ✓, e2e ✓ (11); `npx softure-skills doctor` ✓

## Verdict
Ready. The projects module, the forge access check and the Settings screen follow the plan. Every forge call is a
GET (asserted in `tests/forge/permissions.test.ts`); the actions call `requireUser()` first; the token comes from
`FORGE_TOKEN` and never reaches an error or a page (`requestJson` keeps headers and URLs out of failures).

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | a 401 (refused token) gets its own message instead of naming Metadata |
| Scope | PASS | no scan, no inbox; the project page is the placeholder the plan named |
| Progress honesty | PASS | each item re-run before ticking; 2.4 settled by four screenshots the run inspected |
| Correctness | PASS | S1 |
| Tests | PASS | name rules, six access cases, queries, the service, six e2e cases |
| Data and migrations | PASS | one forward migration with Rollback; unique lower-cased key and checks in the database |
| Security | PASS | W1 (plan review) checked: no file lists watched repositories; fixtures use `example-org/*` |
| Architecture and patterns | PASS | module shaped like the example app's guestbook |
| Lessons | PASS | no lessons recorded yet |

## Findings
- S1 (suggestion): a repository both without state and missing a read permission shows only "Missing permissions";
  the no-state hint appears once the permission is granted and the repository is re-added or rescanned. Decision
  (auto): accepted as is; CMP-3 re-reads every project and refreshes both flags.

## Decisions (auto)
- `workflow.json` → `migrations.dir` points at `modules/projects/migrations`, COCKPIT's first own migrations.
