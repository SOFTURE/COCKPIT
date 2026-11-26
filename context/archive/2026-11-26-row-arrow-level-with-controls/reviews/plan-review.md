# Plan review: row-arrow-level-with-controls

Verdict: approved (auto, autonomous mode).

| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | Warning | When the column wraps to two lines on a phone (a long state), centring puts the arrow between the lines, off the title's line. | Accepted: the arrow then stands level with the whole state-and-controls block, which reads as one group; the check holds for wrapped columns too. |
| 2 | Suggestion | Checking only Broadcast → Sent would leave other rows unguarded. | Applied: the check lives in the shared `expectListEntryRows`, used by every row list's spec. |
