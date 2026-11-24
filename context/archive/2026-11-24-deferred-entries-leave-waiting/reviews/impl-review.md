# Implementation review: deferred-entries-leave-waiting

Scope: full · Date: 2026-11-24 · Commits: 0eed1ad · Gates: typecheck ✓ lint ✓ test ✓ (510/510) e2e ✓ (64/64)

## Verdict
Ready. `buildInbox` reads `(later: #N)` at the end of an entry's text and gives the row a `deferred` state (issue
URL from the stored issues, null otherwise), sorted last and outside `unansweredCount`; the inbox page and the
project page list deferred rows in their own "Put off" group with the answer form kept, and the project tab counts
only waiting rows. The answer issue ends with the §8.6 settle steps for the project.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | `src/mcp/answers.ts` needed no change: the new kind passes through as is |
| Scope | PASS | inbox, two pages, issue text, messages, CHANGELOG |
| Progress honesty | PASS | |
| Correctness | PASS | the marker must close the text, so a sentence that only mentions "later: #4" stays open (tested) |
| Tests | PASS | deferred with an earlier COCKPIT answer, with an unstored issue, a non-marker; issue footer |
| Security | PASS | the issue URL comes from stored issues, never built from entry text |

## Findings
None.

## Decisions (auto)
- The Polish copy of the put-off hint is gender-neutral, as the panel may serve a team.
- The "yes, but the owner still has a step" case is left to SOFTURE/SKILLS#89; the cut entry text to SOFTURE/SKILLS#90.
