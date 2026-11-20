# Plan: bump-softure-skills-0-20

## Approach
Raise the devDependency range to `^0.20.0` with `npm install -D`, let the package's postinstall refresh
`.claude/skills` and the managed block in `AGENTS.md`, re-run `npx softure-skills` to confirm the
install is idempotent (no further diff), and run `npx softure-skills doctor` to check the `context/`
contract.

## Key decisions
- Keep the caret range (`^0.20.0`), as the bootstrap did for 0.19.0.
- The installer's hint to add `npx softure-skills doctor` to CI is not acted on here: AGENTS.md says
  CI is introduced together with the stack, not before.

## Phase 1: Bump the package and refresh the installed skills

- Files: `package.json`, `package-lock.json`, `.claude/skills/**`, `.claude/softure-skills.json`,
  `AGENTS.md` (managed block only).
- Mode: test-after (no code; the checks are the installer and the doctor).
- Done when: the lockfile resolves 0.20.0, a second `npx softure-skills` run leaves the tree unchanged,
  the doctor passes, and the text above the managed block in `AGENTS.md` is unchanged.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump the package and refresh the installed skills

#### Automated
- [x] 1.1 `package-lock.json` resolves `@softure-ai/skills` to 0.20.0 and `.claude/softure-skills.json` records 0.20.0 — 70003c6
- [x] 1.2 A second `npx softure-skills` run leaves `git status` unchanged — 70003c6
- [x] 1.3 `npx softure-skills doctor` exits 0 — 70003c6
- [x] 1.4 `AGENTS.md` above the managed block is byte-identical to master — 70003c6
- [x] 1.5 Gates green (typecheck, lint, test) — all null in workflow.json; the doctor stands in — 70003c6
