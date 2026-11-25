# Implementation review: field-hints-as-help-tooltips

Reviewed: 16cfef4 against plan.md. Verdict: approve. Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (five hints and Routines on `LabelWithHelp`; help label per namespace, recorded in the plan) |
| Correctness | PASS (the repository hint follows the list's state through the `text` prop; the broadcast group is named by the legend text alone via `aria-labelledby`, so the "?" stays out of its name) |
| Tests | PASS (one shared e2e helper opens each "?", reads the tooltip and checks the accessible description) |
| Progress honesty | PASS (screenshots looked at in light and dark at 1280 and 390) |
| Security | PASS (presentation only) |
| Patterns | PASS (one shared component; theme `Tooltip`; 44 px "?" on a phone; copy in both dictionaries) |

## Findings
- Suggestion: a Settings row's description sits on the `li`, which assistive technology reads less often than a
  control's. Kept: the hint is also reachable through the "?" button, and the action's own name already says what it
  does.
- Suggestion: server rows call `useId` (Deploys, Packages, Settings). Kept: React 19 supports it in server components;
  the build and the e2e confirm unique, stable ids.

## Decisions (auto)
- Approved. Status explanations (`productionUnknownHint`, `noStateHint`, drift and inbox hints), card descriptions and
  the confirmation before a send stay visible text, as change.md lists.
