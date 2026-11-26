# Implementation review: grouped-other-project-lists

Verdict: approve. Reviewed the diff from master bc955f6 against `plan.md` and the roadmap item.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning (fixed) | `e2e/polish.spec.ts` read Scan status rows through the one list, which is now one list per group; the first full e2e run failed there. | Fixed: it reads the rows in the Projects card, like `scan-until-settled.ts`; full e2e 109/109 after. |
| 2 | Suggestion (fixed) | `ProjectGroupSections` destructures `{ ...props }`, which reads oddly. | Kept with a comment: the props stay whole so the layouts can be told apart (a bare `props` parameter trips the inline-copy check). |
| 3 | Suggestion | In the stack layout the group heading sits 4 px above the first card, as it sits above a list. | Kept: one spacing standard for every grouped surface (layout rule CT-30..CT-35); screenshots looked at. |
| 4 | Suggestion | Scan status keeps its "Projects" card count (all projects) besides each group's count. | Kept (D3): the card's count was there before; the group counts sit inside it as on Settings. |

Plan drift: none.

## Decisions (auto)
- Findings resolved by the recommended option (autonomous mode).
