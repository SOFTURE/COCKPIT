# Plan: bump-skills-0-33

## Approach
`npm i -D @softure-ai/skills@0.33.0`, `npx softure-skills` (skills, managed block), move the `context-doctor`
pin in `.github/workflows/ci.yml` to 0.33.0 (the installer leaves it; `tests/ci/context-doctor-pin.test.ts`
guards it), then `npx softure-skills doctor`, `--fix --write` and hand fixes only if it reports
`roadmap-item-shape`, then `npx softure-skills state`.

What 0.30.0 → 0.33.0 brings (installer diff): the doctor gains `roadmap-item-shape` (with `--fix`) and
`ci-doctor-trigger` (the `context-doctor` job must run on `pull_request` and on `push` to the main branch);
the managed block names that trigger rule and adds the infrastructure and deploy rule (WORKFLOW §14);
small updates to the plan-review and research skills. Nothing asks for a change in the app's code.

## Key decisions
- Keep the caret range (`^0.33.0`).
- No new tests: the existing pin guard test covers the CI pin; no project code changes.

## Phase 1: Bump, refresh, pin, doctor, state

- Files: `package.json`, `package-lock.json`, `.claude/skills/**`, `.claude/softure-skills.json`,
  `AGENTS.md` (managed block only), `.github/workflows/ci.yml`, `context/state.json`, `context/foundation/roadmap.md`
  only if the doctor names it.
- Mode: test-after.
- Done when: the lockfile resolves 0.33.0, a second installer run is a no-op, the pin guard test passes, the
  0.33.0 doctor exits 0 with no `roadmap-item-shape` finding, `state` regenerates, the gates are green, and
  `AGENTS.md` above the managed block is unchanged.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump, refresh, pin, doctor, state

#### Automated
- [ ] 1.1 `package-lock.json` and `.claude/softure-skills.json` resolve `@softure-ai/skills` to 0.33.0
- [ ] 1.2 A second `npx softure-skills` run leaves `git status` unchanged
- [ ] 1.3 CI pin on 0.33.0; `tests/ci/context-doctor-pin.test.ts` passes
- [ ] 1.4 `npx softure-skills doctor` (0.33.0) exits 0, no `roadmap-item-shape` finding; `npx softure-skills state` exits 0
- [ ] 1.5 `AGENTS.md` above the managed block is byte-identical to master
- [ ] 1.6 Gates green: typecheck, lint (with language scan), test
