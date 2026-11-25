# Implementation review: row-facts-said-once

Reviewed: the branch against plan.md @ 2026-11-25. Mode: standard (autonomous). Verdict: approve.
Findings: 0 critical, 0 warnings, 2 suggestions (both applied).

## Lenses
| Lens | Result |
| --- | --- |
| Drift from the plan | PASS: every repeat in research.md's audit is fixed by 1.2 or 1.3; clean lists untouched |
| Correctness | PASS: answered, put-off, sending and open rows keep their controls; the answer form keeps `data-row-wide`; Retry still fires the same action |
| Tests | PASS: a unit test per moved fact (`tests/inbox/inbox-row-facts.test.tsx`, `tests/adapters/packages-details-facts.test.tsx`, `tests/project-page/history-row-facts.test.tsx`, `tests/scan/scan-project-row.test.tsx`); `e2e/row-facts.spec.ts` checks every touched screen's right column at 1280 and 390 px |
| Honest Progress | PASS: each ticked item names its evidence |
| Migrations | PASS (none) |
| Security | PASS: issue links keep `rel="noreferrer"` and `target="_blank"`; an issue without an address renders as text, never `href="null"` |
| Patterns | PASS: one shared `AnswerFacts` line for the inbox, the project page and "Answered earlier"; `wake-chip.tsx` (CT-23's) not edited |
| Language | PASS: copy through `messages/en.ts` and `messages/pl.ts`; the language scan is green |

## Findings
- S-1 (Suggestion): on a 390 px phone the facts line "Yes · issue #3 · by <name>" wrapped with the "·" alone at the end
  of the first line (seen in the after screenshot). Fix: facts apart by a gap, no "·" separator, in `AnswerFacts` and
  the held packages' line. Applied; screenshots re-taken.
- S-2 (Suggestion): the "before" screenshots of the inbox were first taken with a fixture that had no put-off entry,
  so they did not show the triple "issue #2". Fix: re-taken on the old code with the final fixture. Applied.

## Decisions (auto)
- The overview keeps its broken-reason lines (research.md): they say why the status is Broken and what to do next.
- Times under a badge that names their event stand without a verb (merged, published, opened).
