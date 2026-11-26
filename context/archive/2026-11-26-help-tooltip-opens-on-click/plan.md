# Plan: help-tooltip-opens-on-click

## Approach
`FieldHelp`'s click handler opens the tooltip instead of toggling it and default-prevents the click, so Radix's own
close on click does not run. A regression test drives the race by hand: press, leave and re-enter while pressed so
hover opens the hint, release, and expect the hint still shown.

## Phases
### Phase 1: click opens the hint (TDD)
- `e2e/settings.spec.ts`: new test on "Help: Session"; red first.
- `src/shell/field-help.tsx`: `openOnClick` (`preventDefault`, `setIsOpen(true)`).
- Done when: the new test is red without the fix and green with it; every spec with a "?" passes; typecheck, lint,
  unit tests and the full e2e pass locally; CI is green on the pull request and on master.

## Progress
- [x] Phase 1: test red on the old code (3 of 3, `--repeat-each=3`); with the fix `e2e/settings.spec.ts
  --repeat-each=10`: 60 passed; broadcast, deploys, packages, repository-picker, routines and settings specs: 19
  passed. Typecheck, lint, unit tests clean; full e2e `npx playwright test`: 89 passed (2.8m), local.
