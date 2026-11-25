# Plan: wake-setup-link-opens

## Approach
Point `WAKE_SETUP_URL` at the skills repository's default branch, `master`. A unit test pins the exact URL and fails
on the old value; the wake e2e asserts the button's `href` against the corrected URL.

## Key decisions
- Link the GitHub file on `master` rather than a version-pinned npm copy: GitHub renders the Markdown and its anchor,
  and `master` always carries the current setup steps.

## Phase 1: The setup link points at master

- Files: `src/adapters/wake/owner-word-wake.ts`, `tests/adapters/wake-setup-url.test.ts`, `e2e/wake.spec.ts`,
  `CHANGELOG.md`.
- Mode: TDD (the unit test fails on `main` first).
- Done when: the unit test fails before the fix and passes after; the e2e asserts the new `href`; the new URL answers
  200 from the production server; gates green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: The setup link points at master

#### Automated
- [ ] 1.1 Unit test pins the setup URL on `master` (fails on `main`)
- [ ] 1.2 `WAKE_SETUP_URL` and the wake e2e point at `master`; CHANGELOG entry
- [ ] 1.3 The new URL answers 200 from the production server
- [ ] 1.4 Gates green: typecheck, lint (language scan), test, doctor
