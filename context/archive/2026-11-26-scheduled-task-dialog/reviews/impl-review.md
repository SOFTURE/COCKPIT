# Implementation review: scheduled-task-dialog

Reviewed the branch against plan.md, change.md and the roadmap's layout rule for CT-37..CT-39 (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | A refused New task lost its picked projects: React resets a form after its `<form action>` runs, and the theme's Radix checkboxes follow that reset back to their first (unchecked) state. Found by the e2e. | Critical | Fixed: the form submits by hand (`onSubmit` + `startTransition(formAction)`), so nothing resets; the e2e checks the pick survives. |
| 2 | The time input at 7 rem clipped "08:00 AM" with its clock icon in English at both widths (screenshot). | Warning | Fixed: 8 rem (`w-32`); the roadmap's 7 rem assumed a 24-hour field. |
| 3 | The window's "X" and the footer's button are both named "Cancel" (the dialog's close label is the copy's Cancel, as in CT-30's rename dialog). | Suggestion | Kept: both close without saving; e2e targets the footer's button. |
| 4 | The Broadcast form shares the reset behaviour of finding 1 (on a refused send its picks go back to "all"). | Suggestion | Out of scope (no visible change asked of Broadcast here); recorded, not changed. |
| 5 | The dialog's width and inner scroll are overrides on the theme's `DialogContent`. | Suggestion | Filed SOFTURE/AI#1515; the app switches to the package size when it ships. |

Gates: typecheck, lint, unit 947/947; e2e below in plan Progress.

Verdict: ready to archive.

## Decisions (auto)
- Findings 1, 2 fixed; 3, 4 kept as recorded; 5 filed.
