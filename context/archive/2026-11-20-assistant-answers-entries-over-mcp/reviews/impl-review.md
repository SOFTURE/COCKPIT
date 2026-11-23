# Implementation review: assistant-answers-entries-over-mcp

Scope: full · Date: 2026-11-23 · Commits: b315819, 3812d4b · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓
(212); integration: build ✓, e2e ✓ (28, on the tree of 3812d4b)

## Verdict
Ready. A token issued with "Allow changes" (or an OAuth grant with write access) gets `answer_entry`; it calls the
inbox's own rule `answerEntry` with the token's account as the answerer, so an answer over MCP creates exactly one
owner-word issue, shows the entry as sent in the inbox, and a repeat returns the first answer. A read token never
sees the tool (the SDK answers "not found") and nothing is written. Writes are on unless `MCP_ALLOW_WRITES=0`.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | no CLI (CMP-17), no release (CMP-16) |
| Progress honesty | PASS | every item settled by tests or the e2e on the named commits |
| Correctness | PASS | 1 |
| Tests | PASS | 2 |
| Data and migrations | PASS | no migration; the rule's tables from CMP-5 |
| Security | PASS | 3 |
| Architecture and patterns | PASS | the rule is reused through an `answer` seam, never copied |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | SUGGESTION | An entry text copied with defused markers would have been refused as changed. | Fixed in phase 1: `defuse(stored) === text` stands for the stored text; tested with the hostile fixture. |
| 2 | SUGGESTION | The e2e must not collide with other specs' rows. | Fixed: a new fictional `example-org/upsilon-app`, asserted by name only. |
| 3 | SUGGESTION | A prompt-injected assistant with a write token could answer an entry. | Accepted: writes need a token or grant the owner issues on purpose; the server instructions and the tool description say to answer only what the owner decided; an answer is one issue the project can close; `withConfirmation` would not stop an injected assistant (module README). Recorded under Decisions (auto). |
