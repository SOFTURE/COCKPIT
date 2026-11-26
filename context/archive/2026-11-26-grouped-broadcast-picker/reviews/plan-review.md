# Plan review: grouped-broadcast-picker

Reviewed against change.md, research.md and the code on master `334d25f`.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | Nested fieldsets: `broadcast.spec.ts` reads every checkbox in the "Projects" group, now group checkboxes too. | Accepted: after Clear all they are clear as well; the spec keeps passing, checked in Phase 2. |
| 2 | Warning | The theme draws an indeterminate box with the check icon, unfilled; a person could read it as checked. | D4: file in SOFTURE/AI; `aria-checked="mixed"` carries the state; no local override (AGENTS.md). |
| 3 | Suggestion | A legend's text would name the inner fieldset with its count ("2 of 3"). | Accepted: the inner fieldset is named by the group name's element (`aria-labelledby`). |
| 4 | Warning | CT-38 moves the picker into `src/shell/project-picker.tsx`; logic buried in the form would have to be untangled. | Covered by D1: the rules live in a pure module CT-38 can move as is. |
| 5 | Suggestion | A click on an indeterminate box: Radix reports `true`. | Accepted: a partly picked group becomes fully picked; unit- and e2e-tested. |

Verdict: proceed.

## Decisions (auto)
- All findings resolved in the plan; no change of scope.
