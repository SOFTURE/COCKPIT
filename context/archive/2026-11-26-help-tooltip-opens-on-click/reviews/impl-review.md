# Implementation review: help-tooltip-opens-on-click

Verdict: approve. `FieldHelp` opens on click and default-prevents it, so neither its own toggle nor Radix's close on
click can shut the hint the click asked for; closing by Escape, a press outside, blur and pointer leave is unchanged.
Every "?" in the app uses this one component. The new test failed 3 of 3 on the old code and passes with the fix; the
full e2e passed locally (89). No assertion loosened, no retry. Findings: none.
