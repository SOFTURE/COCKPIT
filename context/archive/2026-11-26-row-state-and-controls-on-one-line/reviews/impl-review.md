# Implementation review: row-state-and-controls-on-one-line

Verdict: approved (auto, autonomous mode).

| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | Warning | On a 390 px phone a long state (a routine's "Last call succeeded: HTTP 200 · <time>", a Broadcast row's two badges) does not fit beside the controls and wraps them under it. | Accepted: the shared check asserts one line whenever both fit the row and the controls under the state only when they do not; the 390 px screenshots show the wrap right-aligned. |
| 2 | Warning | As a row, the FoldRow column stretched to the summary's height centred its line in tall (open, multi-line) items. | Fixed: `align-content: flex-start` keeps the line on the summary's first line (screenshot 06-roadmap-items). |
| 3 | Suggestion | At 1280 px the badge is centred on the 32 px trash can, 6 px under the title's top. | Accepted: the owner asked for badge and trash on one line; the row checks measure the line's top against the title. |
| 4 | Suggestion | `header-refresh.spec.ts:64` failed once in the full run. | Not this change (no row there); filed as #145 per the flaky-test rule. |

Plan drift: none.
