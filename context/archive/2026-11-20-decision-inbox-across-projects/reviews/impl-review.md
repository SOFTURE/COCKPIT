# Implementation review: decision-inbox-across-projects

Scope: full · Date: 2026-11-23 · Commits: e5cd168 · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓ (60); integration: build ✓, e2e ✓ (14); `npx softure-skills doctor` ✓

## Verdict
Ready. The inbox is a read of the scan's stored state and issues: entries flattened, oldest `since` first, answered
ones matched by the cockpit marker (open issue: sent, closed: done), and the sidebar counts the rest. Stored JSON
is narrowed with zod at the boundary, entry by entry, so one malformed entry never hides the others.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | no answer controls (CMP-5) |
| Progress honesty | PASS | 1.4 settled by four screenshots the run inspected |
| Correctness | PASS | |
| Tests | PASS | 7 rows from 2, 0 and 5 entries; sent and done; no-date last; 200 entries under 50 ms; e2e |
| Data and migrations | PASS | none |
| Security | PASS | read only; a secret entry is shown as written with the note that COCKPIT never stores one |
| Architecture and patterns | PASS | |
| Lessons | PASS | no lessons recorded yet |

## Findings
None.

## Decisions (auto)
- The sign-in e2e no longer asserts an empty inbox: the specs share one database and the inbox now holds data; the
  empty state stays covered by its copy and the inbox spec's phone check.
