# Implementation review: scan-refresh-spec-waits-for-render

Verdict: approved (auto, autonomous mode). No drift from the plan; the assertion is stricter than before (0, was ≤ 1).
The other user of `pressScanNow` (`e2e/scan-status-navigation.spec.ts`) gains the same wait, which only makes its
start state certain.
