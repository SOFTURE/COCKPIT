# Implementation review: terminal-prints-cockpit-views

Scope: full · Date: 2026-11-23 · Commits: 627350a, a6d49cb · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓
(215); integration: build ✓, e2e ✓ (29, on the tree of a6d49cb)

## Verdict
Ready. `cockpit overview | inbox | project <owner/name> [--json]` (`cli/bin.ts`, `npm run cockpit`) calls the MCP read
tools of CMP-14 with a read token from `COCKPIT_TOKEN` and prints tables worded by the same helpers as the screens
(moved to `src/overview/describe-overview-row.ts` and `src/inbox/describe-age.ts`), or the narrowed answer as JSON.
No token, no address, a refused token, an unreachable COCKPIT, an unknown project and an unreadable answer each exit
non-zero with a message that names the cause, never a stack. The e2e runs the real binary against the built app and
compares the overview row, the inbox entry and the project JSON with the screens.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | 1 |
| Scope | PASS | no endpoint of its own; publishing the CLI stays with CMP-18 |
| Progress honesty | PASS | every item has a command and a commit |
| Correctness | PASS | |
| Tests | PASS | 2 |
| Data and migrations | PASS | no migration |
| Security | PASS | 3 |
| Architecture and patterns | PASS | external data narrowed with zod; failures as values |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | SUGGESTION | The e2e needs a local edge that adds the client address: the app refuses an unidentified client (`@softure-ai/security`), which Cloudflare identifies in production. | Accept: the spec starts the edge itself; the CLI sends nothing an edge would not. |
| 2 | SUGGESTION | Tests written beside the code. | Checked after the fact: dropping the control-character strip fails 2 tests; restored, green. |
| 3 | SUGGESTION | `@softure-ai/core`'s `Result` takes coded errors only, so the CLI has its own small `Outcome` type for failures that carry data. | Accept: local to `cli/`; not a module gap (a coded error plus a context object would also do). |
