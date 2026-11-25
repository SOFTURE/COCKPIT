# Implementation review: routines-tab-dialogs-and-switch

Reviewed: 8903e26, 1a4bf1f against plan.md. Verdict: approve. Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (kinds list, `FieldHelp`, both dialogs, switch, marks, `ConfirmDeleteButton`, e2e, CHANGELOG) |
| Correctness | PASS (a new routine is stored enabled; an unlisted kind is refused; an older row with another kind shows its raw kind and is still not fired) |
| Tests | PASS (unit: `reports` and `Cockpit Issues` refused; wake test stores an older kind directly; e2e: dialog, tooltip, switch off/on, replace token, cancel and delete) |
| Progress honesty | PASS (screenshots looked at in light and dark at 1280 and 390) |
| Security | PASS (actions keep `requireUser` and the watched-project check; the token never returns to the page) |
| Patterns | PASS (theme `Dialog`, `Select`, `Switch`, `Tooltip`, `Status`, `Badge`; 44 px controls on a phone) |

## Findings
- Suggestion: the kind badge looked a label up with `in`, which also matches inherited keys. Fixed: `Object.hasOwn`
  (1a4bf1f).
- Suggestion: at 390 px the trash can wraps under the other controls. Kept: the row's controls stay right-aligned and
  44 px; the owner's ask is about desktop width.

## Decisions (auto)
- Approved. The "popup by the Routines header" (F-11) is read as the add form in a dialog from the header's action
  slot; the card keeps its description and the "?" hints sit by each input.
