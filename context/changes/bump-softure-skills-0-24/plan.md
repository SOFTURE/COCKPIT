# Plan: bump-softure-skills-0-24

## Approach
Raise the devDependency range to `^0.24.0` with `npm install -D`, re-run `npx softure-skills` to
refresh `.claude/skills` and the managed block in `AGENTS.md` and confirm the install is idempotent,
regenerate `context/state.json` to schema 2 (`npx softure-skills state`, as the release asks), and run
`npx softure-skills doctor`.

What 0.24.0 brings (release notes, installer diff): a stable `id` per `owner_queue` entry and
`schema_version` 2 (#56); an owner-word issue can carry
`<!-- owner-word: {"entry": "<id>", "answer": "yes|no|later"} -->` and the coordinator settles that entry
(#57, a new paragraph in the managed `AGENTS.md` block); the `context-doctor` check run carries the
failure codes as annotations and a job summary (#58); `softure-roadmap` writes optional relative sizes
and a `### Slices` block on request or with `roadmap.sizes: true` (#59); the doctor sweep hands the
owner fewer entries (#60, #61).

## Key decisions
- Keep the caret range (`^0.24.0`), as the earlier bumps did.
- The `context-doctor` CI job stays with CMP-1 (AGENTS.md: CI comes with the stack).
- The doctor sweep is not run: the doctor is at zero once the state is regenerated.

## Phase 1: Bump the package, refresh the skills and regenerate the state

- Files: `package.json`, `package-lock.json`, `.claude/skills/**`, `.claude/softure-skills.json`,
  `AGENTS.md` (managed block only), `context/state.json`.
- Mode: test-after (no code; the checks are the installer and the doctor).
- Done when: the lockfile resolves 0.24.0, a second `npx softure-skills` run leaves the tree unchanged,
  `state.json` has `schema_version` 2 with an `id` per owner-queue entry, the doctor passes, and the
  text above the managed block in `AGENTS.md` is unchanged.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump the package, refresh the skills and regenerate the state

#### Automated
- [ ] 1.1 `package-lock.json` resolves `@softure-ai/skills` to 0.24.0 and `.claude/softure-skills.json` records 0.24.0
- [ ] 1.2 A second `npx softure-skills` run leaves `git status` unchanged
- [ ] 1.3 `context/state.json` has `schema_version` 2 and every `owner_queue` entry has an `id`
- [ ] 1.4 `npx softure-skills doctor` exits 0
- [ ] 1.5 `AGENTS.md` above the managed block is byte-identical to master
- [ ] 1.6 Gates green (typecheck, lint, test) — all null in workflow.json; the doctor stands in
