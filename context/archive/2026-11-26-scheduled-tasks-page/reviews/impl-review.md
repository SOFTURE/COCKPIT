# Implementation review: scheduled-tasks-page

Reviewed the branch against plan.md and change.md (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | The layout puts the done row's sent time on line 2 of the right column, where CT-24's rule allows only controls; plain text there fails `expectSideHoldsStateAndControls`. | Warning | Fixed in the plan's spirit: the sent time is a grey tag badge beside the result on line 1 (it wraps under it at 390 px). Recorded as D7. |
| 2 | `sign-in.spec.ts` pinned the old sidebar list. | Warning | Fixed: the list includes Scheduled tasks after Broadcast. |
| 3 | A one-line `truncate` (nowrap) detail made the page 7 px wider than a 390 px phone (a grid item's min-content). | Warning | Fixed: `line-clamp-1`; the e2e checks no sideways scroll at 390 px. |
| 4 | English times read "8:00 AM" where the roadmap's example shows "08:00"; the formatter follows the locale (Polish "8:00"). | Suggestion | Kept: the locale decides, as every other time in the app. |

No drift otherwise: every Verification point has a test (navigation order, row models, badge tones, tab counts and
sorting; e2e at 1280 and 390 px for the sidebar item and `aria-current`, both tabs in order, Run now to Done with its
badge, Delete with cancel and confirm, done row opening its broadcast, the empty state).

Verdict: ready to archive.

## Decisions (auto)
- Findings 1–3 fixed, 4 kept, as recorded above.
