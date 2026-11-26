# Plan review: help-tooltip-opens-on-click

Verdict: approve. One phase, one component that every "?" shares, so the fix reaches all hints. The regression test
is deterministic (it forces hover to open the hint between press and release instead of relying on timing) and runs
on the stateless Settings page. No migration, no dependency change. Findings: none.
