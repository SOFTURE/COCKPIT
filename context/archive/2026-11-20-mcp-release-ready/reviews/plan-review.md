# Plan review: mcp-release-ready

Reviewed against change.md, research.md, the roadmap (CMP-14 to CMP-16), AGENTS.md and the code on master 73fae50.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | A probe of `/api/mcp` from inside the container has no client address: the security module refuses it before the route, so a 401 would never be seen. | Fix: the probe sends the edge proof and a documentation-range client IP, as the router does. |
| 2 | WARNING | The README's MCP section names `MCP_ALLOW_WRITES` without saying it is a variable in production; set as a secret it would mask `0` in logs and still work, but the convention is variables for switches. | Fix: the production table lists both as optional variables. |
| 3 | SUGGESTION | The owner gets no tracked step for this slice's release. | Applied: an owner step under `## Before the next release`, as CMP-13. |

Verdict: ready to implement after the fixes above (applied to the plan).
