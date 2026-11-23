# Plan: pin-context-doctor-skills-0-30

## Approach
Add `tests/ci/context-doctor-pin.test.ts`, which reads `.github/workflows/ci.yml` and `package-lock.json` and
asserts that every `@softure-ai/skills@<version>` pin in the workflow equals the locked version; see it red
on master, move the pin to 0.30.0, see it green.

## Key decisions
- A guard test instead of reading the version at run time: the job stays install-free (`npx --package`, scripts
  ignored), and the test turns the next bump red until the pin follows.

## Phase 1: Guard test and pin

- Files: `tests/ci/context-doctor-pin.test.ts`, `.github/workflows/ci.yml`.
- Mode: TDD.
- Done when: the test fails on master (0.24.0 vs 0.30.0) and passes with the pin moved; the gates are green;
  `npx --package @softure-ai/skills@0.30.0 softure-skills doctor` exits 0.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Guard test and pin

#### Automated
- [x] 1.1 Guard test red on master: expected `["0.30.0"]`, received `["0.24.0"]` — de0cc1b
- [x] 1.2 Pin moved to 0.30.0; guard test green — de0cc1b
- [x] 1.3 `npx --yes --package @softure-ai/skills@0.30.0 softure-skills doctor` exits 0 — de0cc1b
- [x] 1.4 Gates green: typecheck, lint (language scan), test — de0cc1b
