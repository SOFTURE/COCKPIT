# Implementation review: issues-labelled-cockpit

Reviewed: the branch against plan.md @ 2026-11-25. Verdict: approve.
Findings: 0 critical, 0 warning, 1 suggestion.

## Checks
| Check | Result |
| --- | --- |
| Drift from plan | none: `issue-label.ts`, two-label list, picked label on both writes, copy, fakes |
| Correctness | the pick tries `cockpit` then `owner-word`, a failed label read keeps its error kind; the merged list dedupes an issue carrying both labels |
| Tests | unit: pick per branch, merged list, answer and broadcast fallback; e2e: answer, broadcast (three label shapes), MCP, routine steps |
| NFR-7 | no new write: label existence is read, never created (asserted) |
| Language | English in code; Polish only in `messages/pl.ts` |

## Findings
- Suggestion: a scan now makes one more list request per project (one per label). Accepted as is: pages stay capped
  and the budget reader already sees it.

## Decisions (auto)
- Approved; no fix needed.
