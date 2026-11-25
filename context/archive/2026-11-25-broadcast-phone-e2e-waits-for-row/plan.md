# Plan: broadcast-phone-e2e-waits-for-row

## Approach
Wait for the delete button (and the detail page's Retry button, measured the same way after a click) to be visible
before `boundingBox()`.

## Key decisions
- Same assertions; only an `await expect(...).toBeVisible()` before each measurement after a navigation.
- Phase 2 (after CI failed again): the 44 px checks become one shared polling assertion, `expectTouchTarget`.

## Phase 1: Wait before measuring
- `e2e/broadcast.spec.ts`: `toBeVisible()` before the delete and retry measurements.
- Done when: the spec passes locally and master CI is green on the merge.

## Phase 2: One polling touch-size assertion
- `e2e/expect-touch-target.ts`: `expectTouchTarget(locator)` polls the bounding box until it is at least 44 px high.
- `e2e/broadcast.spec.ts`, `e2e/promote.spec.ts`: every phone touch-size check uses it.
- Done when: both specs pass locally, typecheck and lint are green, and PR CI (both e2e steps) is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Wait before measuring

#### Automated
- [x] 1.1 The phone test waits for the delete and retry buttons before measuring them — 2aa0257
- [x] 1.2 `e2e/broadcast.spec.ts` passes locally; gates green (broadcast spec 4/4) — 2aa0257

### Phase 2: One polling touch-size assertion

#### Automated
- [x] 2.1 Phone touch-size checks in broadcast and promote use the shared polling assertion
- [x] 2.2 Both specs pass locally (7/7); typecheck and e2e lint green
