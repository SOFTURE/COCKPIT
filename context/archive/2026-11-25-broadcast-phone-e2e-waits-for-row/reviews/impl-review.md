# Implementation review: broadcast-phone-e2e-waits-for-row

Reviewed 2026-11-25 on 2aa0257.

## Lenses
- Plan drift: none; two `toBeVisible()` waits, assertions unchanged.
- Root cause: an unawaited `boundingBox()` after `page.goto` (introduced by CT-21's Sent tab); now awaited.
- Tests: `e2e/broadcast.spec.ts` 4/4 locally.

## Decisions (auto)
- No other spec measures right after a navigation without a wait in the CT-21 diff (history spec waits on the panel).
