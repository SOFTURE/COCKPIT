# Plan: broadcast-phone-e2e-waits-for-row

## Approach
Wait for the delete button (and the detail page's Retry button, measured the same way after a click) to be visible
before `boundingBox()`.

## Key decisions
- Same assertions; only an `await expect(...).toBeVisible()` before each measurement after a navigation.

## Phase 1: Wait before measuring
- `e2e/broadcast.spec.ts`: `toBeVisible()` before the delete and retry measurements.
- Done when: the spec passes locally and master CI is green on the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Wait before measuring

#### Automated
- [x] 1.1 The phone test waits for the delete and retry buttons before measuring them — 2aa0257
- [x] 1.2 `e2e/broadcast.spec.ts` passes locally; gates green (broadcast spec 4/4) — 2aa0257
