# Plan: sidebar-footer-e2e-scoped-animation-wait

## Approach
The spec waits only for animations whose target is the visible footer, one of its ancestors (the phone's sheet) or one
of its descendants, instead of every animation in the document. A new test keeps the header's Refresh icon spinning
(the progress poll answered "running" for the whole test, Refresh pressed) and checks the footer is still measured; it
hangs with the old wait.

## Phases
### Phase 1: scope the wait (TDD)
- `e2e/sidebar-footer.spec.ts`: `waitForFooterAnimations(page)` replaces the document-wide wait; new test "on a desktop
  the footer is measured while a scan spins the header's Refresh icon".
- Done when: the new test fails (timeout) with the old wait and passes with the new one; the spec and the full suite
  with `--workers=8` pass locally; typecheck and lint clean; CI green on the pull request and on master.

## Progress
- [x] Phase 1: new test red with the old wait (`page.waitForFunction` timeout, 1 failed / 2 passed), green with the
  scoped wait (`--repeat-each 3`: 9 passed); full suite `--workers=8` twice: 125 passed (3.0m), 125 passed (2.9m);
  typecheck and lint clean — 29b416a
