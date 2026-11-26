# Plan review: list-rows-on-theme-list-entry

Reviewed: plan.md @ 2026-11-26. Mode: standard (autonomous). Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (all 17 callers and the 14 screens of change.md have a step; the deleted files are named) |
| Verifiability | PASS (unit, e2e on both widths, screenshots before/after) |
| Data and migrations | PASS (none) |
| Tests | PASS with W-1 |
| Security | PASS (external links keep `rel="noreferrer"`; no action changes) |
| Scope | PASS with S-1 (`RowActionsMenu`, `ResultBadge`, `status-action-fold-row.tsx` untouched) |

## Findings
- W-1 (Warning): `expectStateInRightColumn` is also called on the project page's roadmap item rows (a `ListRow` in
  `project-page-sections.tsx`, not CT-25's fold row); the helper must move to the theme's slots in the same change, or
  that spec breaks. Accepted into 1.3; confirmed with the CT-25 thread, which keeps to its own lines of the spec.
- S-1 (Suggestion): the before screenshots need the old code; take them from a run of the old code with only the
  capture calls added (1.1), so the before and after names line up. Accepted.

## Decisions (auto)
- Plan accepted with W-1 and S-1 applied.
