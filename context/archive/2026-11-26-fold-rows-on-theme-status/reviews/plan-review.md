# Plan review: fold-rows-on-theme-status

Reviewed: plan.md @ 2026-11-26. Mode: light (presentation only, one component). Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (the one caller moved, the local copy deleted) |
| Verifiability | PASS (markup test, bounding boxes at both widths, inspected screenshots) |
| Data and migrations | PASS (none) |
| Tests | PASS (unit added, two e2e specs updated) |
| Security | PASS (no server change) |
| Scope | PASS (owned files only; CT-26 files untouched) |

## Findings
- Warning: `expectOneRowInset` compares the summary's width with the `li`; with the column beside the details from
  `md` that no longer holds. Fix: measure the row box against `fold-row-with-actions` and keep the 8 px details
  inset and the summary's left edge. Accepted.
- Suggestion: the package centres the chevron on a multi-line summary; check it on the screenshots and file an issue
  in SOFTURE/AI if it reads wrong, rather than overriding the slot. Accepted.

## Decisions (auto)
- Plan accepted with both findings.
