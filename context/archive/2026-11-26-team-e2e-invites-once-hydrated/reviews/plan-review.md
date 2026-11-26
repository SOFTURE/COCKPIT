# Plan review: team-e2e-invites-once-hydrated

Verdict: approve. One phase, spec only, matches the cause in change.md and reuses `e2e/wait-for-hydration.ts`. The
regression test is deterministic (scripts held back), uses an address no other spec uses, and sits in the serial
team spec without changing the later tests' data. No migration, no product code. Findings: none.
