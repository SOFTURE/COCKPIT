# Implementation review: broadcast-phone-e2e-waits-for-row

Reviewed 2026-11-25 on 2aa0257.

## Lenses
- Plan drift: none; two `toBeVisible()` waits, assertions unchanged.
- Root cause: an unawaited `boundingBox()` after `page.goto` (introduced by CT-21's Sent tab); now awaited.
- Tests: `e2e/broadcast.spec.ts` 4/4 locally.

## Decisions (auto)
- No other spec measures right after a navigation without a wait in the CT-21 diff (history spec waits on the panel).

## Phase 2 review
- The first root cause was incomplete: CI failed again after the wait (run 45641555875). The shared polling assertion
  keeps the 44 px threshold and only removes the one-shot read; no assertion is loosened.
- Scope: the polling helper replaces only the touch-size reads in the phone tests of `broadcast.spec.ts` and
  `promote.spec.ts`; other specs' layout comparisons (two boxes side by side) are left as they are.
- Verdict: approve.
