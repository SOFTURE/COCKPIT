---
change_id: broadcast-row-inset-e2e-polls
title: "The broadcast row inset check polls its layout"
status: archived
roadmap_item: null
branch: claude/project-thread-mjq2l1
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
The e2e that checks a sent broadcast row's hover box stays inside its list item reads the row's layout with a
web-first, polling assertion, so a box read while the page re-renders no longer comes back null and fails the run.

## Context
Master CI on b16136f (the CT-15 merge) went red: `e2e/broadcast.spec.ts:72` threw "The sent broadcast row has no
layout to measure" (https://github.com/SOFTURE/COCKPIT/actions/runs/45654283612). The page snapshot at the failure
shows the row rendered; the header's refresh ("0 of 10 refreshed") re-renders the list while the test reads both
bounding boxes once with `Promise.all`, and `boundingBox()` does not wait, so it read null. The same race was fixed
for the phone test in `broadcast-phone-e2e-waits-for-row` (`expectTouchTarget` polls). The test's own assertion is
unchanged.

## Constraints
- Only the measurement changes; the inset rule (`link.x ≈ item.x`, right edge inside) stays exactly as asserted.
- No product code change.

## Notes
- Research skipped: the cause is in the CI log and the page snapshot, and the earlier archived change fixed the same
  pattern.
- Frame skipped: a test robustness fix with a known cause.

## Done
- `broadcast-row-inset-e2e-polls`: the sent broadcast row's inset check in `e2e/broadcast.spec.ts` polls both boxes with `toPass`, fixing the red master CI on the CT-15 merge (run 45654283612); archived in `archive/2026-11-25-broadcast-row-inset-e2e-polls/`
