# Plan review: grouped-project-lists

Reviewed against change.md, research.md and the code on master `d55c2ff`.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | Dropping `overview.groups` would break the MCP contract and the digest. | Accepted as planned (D1): keep it, add `rows`. |
| 2 | Warning | Three e2e specs find projects through `Projects: {status}` lists, which disappear. | Covered in Phase 4: check the row's status slot. |
| 3 | Suggestion | The list label could collide with the old `Projects: {status}` names in a spec. | Accepted: statuses and group names differ; specs use exact names. |
| 4 | Warning | Shared e2e database: other specs add groups. | Covered: unique names, relative order only (D5). |
| 5 | Suggestion | Settings card used `border-t` only; sections use `border-y`. | Accepted: one standard (F-2), as the layout says. |

Verdict: proceed.

## Decisions (auto)
- All findings resolved in the plan; no change of scope.
