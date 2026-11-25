# Plan review: roadmap-item-status-above-action

Reviewed: plan.md @ 2026-11-25. Mode: light (one view's layout). Verdict: ready.
Findings: 0 critical, 1 warning, 0 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (status on top, action under it, inside the bar, one hover box) |
| Verifiability | PASS (e2e geometry at two widths, screenshots) |
| Data and migrations | PASS (none) |
| Tests | PASS (promote flows rerun; geometry e2e added) |
| Security | PASS (no new input or route) |
| Scope | PASS (no theme change; CT-14 files untouched) |

## Findings
- Warning: the inert copy is a second `PromoteForm` instance; role queries must not find it twice. Accepted: the copy
  is `aria-hidden` and `inert`, which Playwright's role queries and assistive technology skip; the e2e asserts one
  button per row.

## Decisions (auto)
- Plan accepted with the warning's check added to 1.2.
