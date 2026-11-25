---
change_id: routines-e2e-waits-for-hydration
title: "The routines e2e fills the broadcast form only once the page is interactive"
status: archived
roadmap_item: null
branch: claude/project-thread-2kdm7o
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
`ci` on master is green again. The `e2e under load` step failed on 91bc3a8 (run 45602730383) in
`e2e/routines.spec.ts`: after Send broadcast the page stayed on `/broadcast`.

## Context
The spec opened `/broadcast` with `page.goto` and filled Title and Message at once. The broadcast form's fields are
controlled React inputs, so under load hydration reset the typed text, and the empty required Title blocked the
submit in the browser. The server never saw a request: the run's server log has no send and no fire for the spec's
projects. `broadcast.spec.ts` does not hit this because it reaches the page by a client navigation and waits for
"Clear all" before it types.

## Constraints
- Spec only; no product change, no retries, no loosened assertion, no release.

## Notes
- Research skipped: the failing run's log and page snapshot are the investigation; recorded above.
- Frame skipped: a red master is fixed at once (owner's standing order).
- Typed text lost on hydration is the same product gap as #55 (a controlled field swapped while typing); not widened here.

## Done
- The spec waits for "Clear all" to set the count to 0 (the page is interactive), then fills the fields, checks
  `2 of N picked` and the Title's value before it sends.
