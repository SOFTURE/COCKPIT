# Implementation review: fold-rows-on-theme-status

Reviewed: commit 3d0d365 against plan.md. Verdict: approve.
Findings: 0 critical, 0 warning, 1 suggestion.

## Checks
| Check | Result |
| --- | --- |
| Drift from plan | none: one caller moved, the local copy deleted, owned files only |
| Correctness | `id`, `scroll-mt-16`, `data-item`, `data-status` stay on the `li`; one control per row; no action list without a control |
| Tests | unit markup test (failed on the old row); e2e column by bounding box at 1280/390, touch-sized control at 390, open/close, `#item-…` link, promote |
| Progress honesty | every item carries its evidence and SHA |
| Migrations / security | none / no server change |
| Language scan | clean |

## Findings
- Suggestion: on a multi-line summary the package centres the chevron and the right column (the local row put both
  on line 1). Not overridden locally (package-first rule); filed as SOFTURE/AI#1495. Accepted as a follow-up for the
  package; the rows stay aligned with each other (same column edge, same inset), screenshots inspected.

## Decisions (auto)
- Approved.
