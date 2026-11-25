---
change_id: broadcast-phone-e2e-waits-for-row
title: "The broadcast phone e2e waits for the Sent tab's row before measuring it"
status: archived
roadmap_item: null
branch: claude/project-thread-3okqon
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
Master's `ci` e2e is green again: the 390 px broadcast test waits for the sent broadcast's delete button on the Sent
tab before it reads its height.

## Context
After CT-21 (PR #111, bb4267b) the phone test opens `/broadcast?tab=sent` and reads `boundingBox()` of the delete
button right away. `boundingBox()` does not wait, so on a slower runner it read 0 before the row rendered
(run https://github.com/SOFTURE/COCKPIT/actions/runs/45639805814, `e2e/broadcast.spec.ts:208`, "Received: 0").

## Constraints
- Fix the test's race, never loosen the 44 px assertion.

## Notes
- Research and frame skipped: the failure names the line and its cause (an unawaited measurement after a navigation).
- Follow-up on the same PR: `toBeVisible()` alone was not enough. The 4-worker e2e step failed again on the same line
  (run https://github.com/SOFTURE/COCKPIT/actions/runs/45641555875): the button was visible, then the one-shot
  `boundingBox()` read null. Not reproduced locally (3 full 4-worker runs, an 8x CPU-throttled run with a header
  refresh during the measurement, no DOM removal of the button seen, the Sent tab's HTML is not streamed). Every touch
  size check of the phone tests in `broadcast.spec.ts` and `promote.spec.ts` now goes through one shared, polling
  assertion (`e2e/expect-touch-target.ts`), the web-first form of the same 44 px rule.
