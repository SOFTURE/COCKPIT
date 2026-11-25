# Plan: routines-e2e-waits-for-hydration

## Approach
Reorder the broadcast steps of `e2e/routines.spec.ts` so nothing is typed before the page is interactive, the way
`broadcast.spec.ts` already does, and assert the form's state before Send broadcast.

## Phases
### Phase 1: wait for hydration (test-after)
- `e2e/routines.spec.ts`: Clear all, expect `0 of N picked`, then fill Title and Message, pick the two projects,
  expect `2 of N picked` and Title's value, then send.
- Done when: the full e2e suite passes with `--workers=4` locally, and CI is green on the pull request and on master.

## Progress
- [x] Phase 1: spec reordered; `npx playwright test --workers=4`: 75 passed (2.7m), local.
