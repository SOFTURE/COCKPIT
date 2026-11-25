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
