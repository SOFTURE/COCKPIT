# Implementation review: production-deploy-card-readable

Scope: full · Date: 2026-11-24 · Commits: 31580bc · Gates: typecheck ✓ lint ✓ test ✓ doctor ✓

## Verdict
Ready. The Deploy block on the Production tab is two cards: "In production" (version large, tinted green while a
version is known) and "Last deploy" (version, time, run link at the card's head, and the deploy and verification
steps as filled badges with an icon). The colours come from one table (`deploy-step-looks.ts`) pinned by a unit test;
the e2e asserts the tones on a production build. Screenshots light/dark at 1280 and 390 were inspected before and
after.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | the deploy component, its looks, two message keys; the roadmap view is untouched |
| Progress honesty | PASS | |
| Correctness | PASS | passed, failed at a step, skipped verification and unknown production all render |
| Tests | PASS | unit test of every state's colour; e2e on tones and versions |
| Security | PASS | presentation only; the run link keeps `rel="noreferrer"` |

## Findings
None.

## Decisions (auto)
- Skipped verification uses the palette's `yellow` (amber); warnings elsewhere in the app use `orange` for a
  problem to act on, which a skipped verification is not.
