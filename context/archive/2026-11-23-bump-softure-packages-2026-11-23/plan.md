# Plan: bump-softure-packages-2026-11-23

## Approach
`npm install -D @softure-ai/skills@latest`, re-run `npx softure-skills` (refreshes `.claude/skills` and the
managed `AGENTS.md` block; a second run must be a no-op), `npx softure-skills state`, `npx softure-skills
doctor`, then the gates from `context/workflow.json`.

What 0.24.0 → 0.30.0 brings (installer diff; the SOFTURE/SKILLS release notes are outside this session's forge
access): the managed block states one item = one change = one thread for coordinators and threads; the roadmap
report routine becomes `routines/roadmap-heartbeat.md`, run in a fresh session per fire; the doctor also writes
its failure codes as one log line and the state schema/script gain fields; `wt_config.py` small update; new
`routines/package-updates.md`. Nothing asks for a change in the app's code, config or migrations.

## Key decisions
- Keep the caret range (`^0.30.0`).
- No new tests: the bump changes no project code (routine step 4).

## Phase 1: Bump, refresh the skills, regenerate the state

- Files: `package.json`, `package-lock.json`, `.claude/skills/**`, `.claude/softure-skills.json`,
  `AGENTS.md` (managed block only), `context/state.json`.
- Mode: test-after (no code; the checks are the installer, the doctor and the gates).
- Done when: the lockfile resolves 0.30.0, a second installer run is a no-op, the doctor exits 0, the gates are
  green, and `AGENTS.md` above the managed block is unchanged.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump, refresh the skills, regenerate the state

#### Automated
- [x] 1.1 `package-lock.json` resolves `@softure-ai/skills` to 0.30.0, equal to `npm view @softure-ai/skills version` and `.claude/softure-skills.json` — e972f44
- [x] 1.2 A second `npx softure-skills` run leaves `git status` unchanged — e972f44
- [x] 1.3 `npx softure-skills state` and `npx softure-skills doctor` exit 0 — e972f44
- [x] 1.4 `AGENTS.md` above the managed block is byte-identical to master — e972f44
- [x] 1.5 Gates green: typecheck, lint (with language scan), test 254/254 — e972f44
