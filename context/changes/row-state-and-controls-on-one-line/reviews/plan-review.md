# Plan review: row-state-and-controls-on-one-line

Verdict: approved (auto, autonomous mode).

| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | Warning | A stylesheet override of package classes is the kind of local workaround AGENTS.md names; it can silently break on a theme bump. | Accepted with guard: the gap is filed (SOFTURE/AI#1508), the file names it, and the shared e2e check fails if a bump changes the layout. |
| 2 | Warning | The inbox's deferred row has a badge and up to three answer buttons; on one line at 390 px they could overflow. | Applied: `flex-wrap: wrap` keeps it inside the row; the full e2e's no-sideways-scroll checks and the 390 px screenshots cover it. |
| 3 | Suggestion | `FoldRow` below `md` is already one line; the rule only needs `md` up. | Applied: the FoldRow rule sits in a `min-width: 48rem` media query (the theme's `md`). |
