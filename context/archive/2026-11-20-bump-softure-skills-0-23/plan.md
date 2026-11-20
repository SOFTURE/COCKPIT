# Plan: bump-softure-skills-0-23

## Approach
Raise the devDependency range to `^0.23.0` with `npm install -D`, re-run `npx softure-skills` to
refresh `.claude/skills` and the managed block in `AGENTS.md` and confirm the install is idempotent,
add `"project": "COCKPIT"` to `context/workflow.json` as the installer asks, and run
`npx softure-skills doctor`.

What 0.22.0 and 0.23.0 bring, read from the installer diff and the release notes: the doctor sweep has
fewer false positives and a `superseded` class (0.22.0); `project` is never null in `state.json`, an
idle placeholder roadmap is no active roadmap, and the doctor runs in a CI job named `context-doctor`
that `portfolio --source api` reads as a check run (0.23.0). The managed block of `AGENTS.md` changes
one sentence (the job name).

## Key decisions
- Keep the caret range (`^0.23.0`), as the earlier bumps did.
- The `context-doctor` CI job is not added here: AGENTS.md introduces CI together with the stack
  (CMP-1), and the roadmap revision records that CMP-1 adds the job under that name.
- `project` is `COCKPIT`, the name the roadmap front matter already uses.

## Phase 1: Bump the package and refresh the installed skills

- Files: `package.json`, `package-lock.json`, `.claude/skills/**`, `.claude/softure-skills.json`,
  `AGENTS.md` (managed block only), `context/workflow.json` (`project` only).
- Mode: test-after (no code; the checks are the installer and the doctor).
- Done when: the lockfile resolves 0.23.0, a second `npx softure-skills` run leaves the tree unchanged,
  the doctor passes, and the text above the managed block in `AGENTS.md` is unchanged.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump the package and refresh the installed skills

#### Automated
- [x] 1.1 `package-lock.json` resolves `@softure-ai/skills` to 0.23.0 and `.claude/softure-skills.json` records 0.23.0 — 5915f60
- [x] 1.2 A second `npx softure-skills` run leaves `git status` unchanged — 5915f60
- [x] 1.3 `npx softure-skills doctor` exits 0 — 5915f60
- [x] 1.4 `AGENTS.md` above the managed block is byte-identical to master — 5915f60
- [x] 1.5 Gates green (typecheck, lint, test) — all null in workflow.json; the doctor stands in — 5915f60
