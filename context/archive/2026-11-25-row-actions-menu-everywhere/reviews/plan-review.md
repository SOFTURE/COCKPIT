# Plan review: row-actions-menu-everywhere

Reviewed: plan.md @ 2026-11-25. Mode: autonomous. Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (Layout and Verification lines of change.md map to 1.2, 1.3 and 1.4) |
| Verifiability | PASS with W-1 |
| Data and migrations | PASS (none) |
| Contracts between steps | PASS (same server actions and form fields; `data-send-line` kept) |
| Scope | PASS (shared menu and server actions untouched; `routines.spec.ts` only where the moved control is clicked) |
| Lessons | PASS (messages in both dictionaries; tokens only; no non-English text in code) |

## Findings
- W-1 (Warning): the change's Verification asks the e2e to run Retry send from the menu, but a send with both an issue
  and a Retry send cannot be produced through the UI (research). Decision: Retry send runs inline in the e2e (where
  the rule puts it whenever it shows up in practice); the menu's Retry send item and the three-control row are pinned
  by the markup unit test, and the menu item calls the same action with the same fields as the inline form.
- S-1 (Suggestion): the routines e2e also reads the broadcast row; adjust it in the same phase so CI stays green.
  Applied (listed in Phase 1 files).

## Decisions (auto)
- Issue in a menu opens through `window.open(..., "noopener,noreferrer")` rather than widening `RowAction` with a
  link variant: the shared component stays as CT-22 left it (CT-24 runs in parallel on it).
