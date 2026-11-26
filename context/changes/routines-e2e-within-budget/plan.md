# Plan: routines-e2e-within-budget

## Approach
Split the one long flow into three serial tests (add and Test; broadcast and fire states; Retry and the Routines tab),
each with the same assertions, so each step gets its own 30 s budget. The broadcast's path passes from the second
test to the third through a spec-level variable; the spec is already `serial`, so a failure skips the rest.

## Key decisions
- Split rather than a longer `setTimeout`: every assertion stays, and a step that really hangs still fails fast.

## Phase 1: Split the routines fire flow

- Files: `e2e/routines.spec.ts`.
- Mode: test-after (the failure is the timeout under load; evidence is the load pass).
- Done when: the local plain pass and the `--workers=4` pass are both green, with the three tests each well under
  30 s, and the pull request's CI is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Split the routines fire flow

#### Automated
- [ ] 1.1 The flow runs as three serial tests with every original assertion (`e2e/routines.spec.ts`)
- [ ] 1.2 Local e2e green in the plain pass and with `--workers=4`; each of the three tests under 30 s
- [ ] 1.3 The pull request's CI green, then master CI green on the merge
