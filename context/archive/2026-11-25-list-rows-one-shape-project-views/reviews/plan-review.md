# Plan review: list-rows-one-shape-project-views

Reviewed: plan.md @ 2026-11-25. Mode: light (UI, no data). Verdict: ready.
Findings: 0 critical, 2 warnings, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every list of the item plus the inbox's answered list and held packages) |
| Verifiability | PASS (unit tone map; e2e right-column check per screen at two widths; screenshots) |
| Data and migrations | PASS (none) |
| Tests | PASS |
| Security | PASS (no new input; external links keep `rel="noreferrer"`) |
| Scope | PASS (`deploy-details.tsx` keeps its card layout; only its result colours follow the map) |

## Findings
- Warning: the overview's chips carry their own links (CI run, pull request, doctor run); under a stretched row link
  they would be covered. Accepted: the chip line is `relative`, above the overlay; e2e clicks stay as they are.
- Warning: e2e pin `data-tone="blue"` for a pending doctor; that is the intended change (pending gray). Accepted: the
  e2e is updated to gray with the reason in the commit.
- Suggestion: one answer-state badge for the inbox rows and the answered list. Accepted (`AnswerStateBadge`).

## Decisions (auto)
- Plan accepted.
