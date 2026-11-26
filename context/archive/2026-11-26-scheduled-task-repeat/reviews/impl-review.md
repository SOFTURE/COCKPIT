# Implementation review: scheduled-task-repeat

Reviewed the branch against plan.md, change.md and the roadmap's layout rule for CT-37..CT-39 (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | On a phone the repeat choices stacked one per line, three 44 px lines for one choice; the roadmap asks for one row. Found in the screenshot. | Warning | Fixed: one wrapping row at every width, each choice 44 px high on a phone; the e2e checks "No" and "Daily" share their top edge (all three from md). |
| 2 | The first insert of the next run built a text[] literal by hand. | Critical | Fixed before commit: the next run is an `insert … select` copy of the claimed row, every value a parameter. |
| 3 | The planned-time badge's relative part ("in 16 hours") changes while the e2e runs; comparing the whole badge could fail at an hour boundary. | Warning | Fixed: the e2e compares the date and time only. |
| 4 | For the seconds a run is sent, its sending row and the next run both show under Scheduled. | Suggestion | Kept (plan review 7): the sending row says "Sending" and has no menu. |
| 5 | A planned time inside the hour a spring DST change skips moves an hour later that day and keeps that wall clock afterwards (core's rule). | Suggestion | Kept, recorded in research; 08:00 is never affected. |

Gates: typecheck, lint, unit (scheduled 85, full suite green); e2e below in plan Progress. No SOFTURE package gap found (theme `RadioGroup`, core date helpers cover it); nothing filed.

Verdict: ready to archive.

## Decisions (auto)
- Findings 1-3 fixed; 4, 5 kept as recorded.
