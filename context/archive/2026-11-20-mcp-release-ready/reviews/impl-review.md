# Implementation review: mcp-release-ready

Reviewed the diff 73fae50..55b8426 against plan.md, change.md, the roadmap (CMP-14 to CMP-16) and AGENTS.md.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | SUGGESTION | The worker does not get the MCP switches, while it loads the same configuration. | Accept: the worker serves no MCP and its pruning schedules do not read the switches (research). |
| 2 | SUGGESTION | The dry run renders `MCP_ALLOW_WRITES=0`, so the write path is not probed in the production stack. | Accept: the e2e covers answering with writes on (CMP-15); the dry run proves the switch reaches the app and takes effect (the challenge drops `mcp:write`). |

Drift from plan: none. Tests: dropping `MCP_DIAGNOSTICS` from the app turns the stack test red (mutation checked);
the required names and `secret-names` are unchanged. Security: no secret or host committed; the dry-run probe uses a
documentation-range client address and the stack's own fictional edge proof.

Verdict: ready.
