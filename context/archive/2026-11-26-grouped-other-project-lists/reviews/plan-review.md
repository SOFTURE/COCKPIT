# Plan review: grouped-other-project-lists

Reviewed against change.md, research.md and the code on master `bc955f6`.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | `scanUntilSettled` finds rows in "Projects by last read", used by most specs; a per-group label breaks them all. | Covered (D4): find rows in the "Projects" region. |
| 2 | Warning | Packages rows are cards, not list items; forcing them into a `List` changes their look ("rows unchanged"). | Accepted (D1): `stack` layout in the shared component. |
| 3 | Suggestion | Changing a CT-32 file while CT-33/CT-34 run in parallel. | Accepted: neither touches `project-group-sections.tsx`; the default keeps every caller unchanged. |
| 4 | Warning | Shared e2e DB: new owners must not collide with other specs' groups. | Covered: `oak-works`, `hazel-labs` and the group names Oak desk, Hazel desk unused; positions read relatively. |
| 5 | Suggestion | The empty-group risk of Deploys should be proven, not assumed. | Covered: hazel-app has no deploy workflow; spec checks no Hazel section on Deploys. |

Verdict: proceed.

## Decisions (auto)
- All findings resolved in the plan; no change of scope.
