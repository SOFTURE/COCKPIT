# Implementation review: assistant-reads-cockpit-over-mcp

Scope: full · Date: 2026-11-23 · Commits: 7c7d42a, 720669f · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓
(156); integration: build ✓, e2e ✓ (21, on the tree of 720669f)

## Verdict
Ready. `@softure-ai/mcp-access` 0.7.8 serves COCKPIT over MCP at `/api/mcp` with read tokens (token page at
`/account/mcp`, linked from Settings) and OAuth 2.1 (open registration, consent page, discovery). The server has three
read tools, `get_overview`, `get_inbox` and `get_project`, plus `get_server_info`; each tool reads through the
screens' own loaders, so the values match the screens (e2e compares entry texts, ages, the unanswered count, the
waiting count, the roadmap counter and the status group). Writes are off (`allowWrites: false`): no tool answers an
entry. Repository text is wrapped in untrusted-data markers and defused. The worker prunes tokens daily.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | no answer tool (CMP-15), no CLI (CMP-17) |
| Progress honesty | PASS | 2.3 settled by four screenshots the run inspected (1280 and 390 px, light and dark) |
| Correctness | PASS | 1 |
| Tests | PASS | 2 |
| Data and migrations | PASS | module migrations in schema `mcp` only; no app migration |
| Security | PASS | 3 |
| Architecture and patterns | PASS | module first; server in `src/mcp/**` behind a reader seam |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | SUGGESTION | `get_project` shows the overview row and entries only; the project page grows in CMP-9/10. | Accept: recorded under Decisions (auto); CMP-9 may extend the tool. |
| 2 | SUGGESTION | Tests written beside the code. | Checked after the fact: dropping the untrusted wrap fails 2 server tests; dropping the public paths fails the guard test; restored, green. |
| 3 | SUGGESTION | Open OAuth client registration lets anyone register a client. | Accept: a client grants nothing without the owner's consent, registration is rate-limited (`mcp-oauth`), unused clients are pruned after a day. |
