# Plan review: assistant-answers-entries-over-mcp

Reviewed against change.md, research.md, the PRD (FR-14, FR-5, G-2, G-5), the module README and the code on master
7aedbdb.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | `allowWrites` is read when `softure.config.ts` loads, so a test cannot flip the env per case. | Fix: export `isMcpWritingAllowed(env)` from the config module's helper and test it; the config test checks the loaded value under the test env. |
| 2 | WARNING | The tool list per access level changes (write list gains a tool), which renews sessions; `measureServedToolLists` must show read 3, write 4 (plus none from serverInfo in tests). | Applied: the server test asserts both counts. |
| 3 | WARNING | `entry_changed` would refuse an assistant that copied a defused text. | Applied: map `defuse(stored) === text` to the stored text before calling the rule; tested with the hostile fixture. |
| 4 | SUGGESTION | The FIXTURE_READER inbox and the database must hold the same entries, or the tool finds the entry in one and not the other. | Applied: the server test stores the fixture's state for `example-org/alpha-app` in the test database. |
| 5 | SUGGESTION | The e2e shares a database with other specs; use a repository no other spec watches. | Applied: a new fictional `example-org/upsilon-app`. |
| 6 | SUGGESTION | The README's MCP section says no tool answers an entry. | Applied: phase 2 updates it. |

Verdict: ready to implement after the fixes above (folded into the plan).
