# Implementation review: roadmap-item-status-above-action

Reviewed: bcb5c9a against plan.md. Verdict: approve. Findings: 0 critical, 0 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (`ItemRow` layout, the promote e2e, a CHANGELOG line) |
| Correctness | PASS (no `fold-row-actions` strip; the action lies in the bar under the status at 1280 and 390 px; active roadmaps and done items draw no action and no placeholder) |
| Tests | PASS (geometry asserted before and after a promotion and on a phone; one button per row despite the inert copy; full e2e 75/75, unit 683/683) |
| Progress honesty | PASS |
| Security | PASS (no new input, route or data) |
| Patterns | PASS (summary inset from `row-inset.ts` kept; the action stays outside `<summary>`) |

## Findings
- Suggestion: the inert copy is a second `PromoteForm` instance, so right after a send (before the page is revalidated)
  the copy keeps the button's width while the real control shows the link. Both are about the same width and the
  revalidation that follows the action renders both as the link. Accepted as is.

## Evidence
- After: `cockpit/evidence/roadmap-item-status-above-action/01-item-row-after-{1280,390}-{light,dark}.webp` (LT-1
  hovered: the bar and the Promote light as one box; status on top, Promote under it).

## Follow-up
- After the owner asked for generic fixes, the layout moved into the shared `StatusActionFoldRow`
  (`src/shell/status-action-fold-row.tsx`); `ItemRow` only fills its slots. Reviewed: no behaviour change, the same e2e
  geometry passes.

- CI "e2e under load" failed once in the routines spec: the routine form's Name, typed before hydration, was lost.
  Root cause fixed in the test (`e2e/wait-for-hydration.ts`), not retried.

## Decisions (auto)
- Approved.
