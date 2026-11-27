# Plan: packages-help-tooltip-under-load

## Approach
Hold the header's scan refresh in every test of `e2e/packages.spec.ts` (`beforeEach(holdScanRefresh)`), the pattern
the other popover and dialog specs use. No retry, no longer timeout, no assertion loosened. The header refresh itself
stays covered by header-refresh.spec.

## Phases

### Phase 1: hold the scan refresh in packages.spec (test-after)
- `e2e/packages.spec.ts`: import `holdScanRefresh`, add `test.beforeEach` with a comment naming #169.
- Done when: typecheck and lint pass; the full e2e passes with `--workers=2` and `--workers=4`; packages.spec
  repeated under 4 workers (`--repeat-each`) next to the full suite passes.

## Progress
- [x] Phase 1: packages.spec holds the scan refresh; full e2e green with 2 and 4 workers — `npx playwright test --workers=4`: 128 passed (3.7m); `--workers=2`: 128 passed (4.5m); typecheck and lint clean
