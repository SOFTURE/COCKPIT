# Implementation review: routines-e2e-waits-for-hydration

Verdict: approve. The diff only reorders the spec's steps and adds two assertions that prove the form is ready
(`0 of N picked` after Clear all, `2 of N picked` and the Title's value before Send). No assertion was loosened and no
retry added. Full suite under load locally: 75 passed. Findings: none.
