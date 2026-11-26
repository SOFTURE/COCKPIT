# Plan: routine-row-menu-e2e-within-budget

## Approach
Split the row menu flow into four serial tests: add the routine (field hints, layout), the menu at 1280 px, the menu at
390 px, and the confirmed delete. Each opens the routine's tab itself through one helper; every assertion and evidence
capture is kept.

## Key decisions
- Split per width rather than a longer `setTimeout`, as in `routines-e2e-within-budget`.

## Phase 1: Split the row menu flow

- Files: `e2e/routines.spec.ts`.
- Mode: test-after (the failure is the timeout under load; evidence is the load pass).
- Done when: the local plain pass and the `--workers=4` pass are both green with each new test well under 30 s, and
  the gates are green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Split the row menu flow

#### Automated
- [x] 1.1 The flow runs as four serial tests with every original assertion (`e2e/routines.spec.ts`) — 6c838c3
- [x] 1.2 Local e2e green in the plain pass and with `--workers=4`; each new test under 30 s (plain 91/91, steps 4.1+4.1+3.4+1.9 s; --workers=4 91/91, steps 5.7+6.3+6.0+3.0 s) — 6c838c3
- [x] 1.3 Gates green: typecheck and lint (pre-commit hook) — 6c838c3
