# Plan review: row-menus-on-theme-row-actions-menu

Reviewed: plan.md @ 2026-11-26. Mode: autonomous. Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (Outcome, Layout and Verification of change.md map to 1.1–1.5) |
| Verifiability | PASS with W-1 |
| Data and migrations | PASS (none) |
| Contracts between steps | PASS (same server actions and fields; rows keep their `data-*`) |
| Scope | PASS (`ConfirmDeleteButton` untouched; `routines-section.tsx` only if the slot needs it) |
| Lessons | PASS (messages in both dictionaries; tokens only; no fixed shared-DB counts in e2e) |

## Findings
- W-1 (Warning): the pending state of the delete dialog lasts milliseconds against the local server, so an e2e that
  only clicks cannot see it. Decision: hold the server action's POST with `page.route` until the assertions on the
  disabled buttons and "Deleting…" pass, then release it.
- S-1 (Suggestion): the theme trigger has no `title`; the accessible name stays (`aria-label`). Accepted as the
  theme's design, no override.

## Decisions (auto)
- Open issue in the menu stays `window.open(..., "noopener,noreferrer")`; the theme's action has no link variant.
