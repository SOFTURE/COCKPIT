# Plan: repository-field-keeps-typed-text

## Approach
1. `page.tsx` starts `loadRepositorySuggestions(repositories)` without awaiting it and renders one
   `AddRepositoryForm` outside any Suspense, passing the promise. The "list read at / Refresh list" row stays a
   streamed server component in its own Suspense (fallback `null`), awaiting the same promise.
2. `AddRepositoryForm` takes `suggestions: Promise<RepositorySuggestions>`, holds the current suggestions in state
   (`loading` first) and adopts the resolved value in an effect; a rejection becomes `unavailable`; a newer promise
   keeps the last suggestions until it resolves.
3. e2e: a third server (`slow-list` project, its own port and database) whose `FORGE_API_URL` points at the fake
   forge's `/slow-list` prefix, where `/user/repos` answers after a delay. `e2e/slow-repository-list.spec.ts` signs
   in, sees the loading hint, types a name, waits for the list (pick hint and search placeholder), checks the field
   still holds the name and is the only Repository field, presses Add and sees "is now watched".
4. `e2e/submit-repository.ts` no longer waits for the list before typing (the workaround #55 named).

## Key decisions
- An effect over `use()`: the field must not suspend at all, and `use()` would need a Suspense boundary that still
  swaps something out. The effect keeps one mounted input with one state.
- A dedicated e2e server rather than a test hook in the cache: production code stays free of test switches.

## Phase 1: One mounted field

- Files: `app/(app)/settings/page.tsx`, `src/projects/add-repository-form.tsx`, `e2e/fake-forge.ts`,
  `e2e/fixtures.ts`, `playwright.config.ts`, `e2e/slow-repository-list.spec.ts`, `e2e/submit-repository.ts`,
  `CHANGELOG.md`.
- Mode: TDD at the e2e level: the new spec is red on master's page and green after the fix.
- Done when: the spec fails before the fix and passes after; gates green; the full e2e green; the pull request's CI
  green (both e2e runs).

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: One mounted field

#### Automated
- [x] 1.1 New e2e red before the fix (`toHaveValue` received "": the typed name was lost when the list arrived) — b3df3e8
- [x] 1.2 New e2e green after the fix (1/1, 7.6 s) — b3df3e8
- [x] 1.3 Gates green: typecheck, lint (language scan), test 441/441 — b3df3e8
- [x] 1.4 Full e2e green locally: 60/60 with default workers twice, 60/60 with 4 workers twice (a first 4-worker run caught an inbox-count race in `mcp.spec.ts`, fixed in the same commit); the pull request's CI is the merge gate — b3df3e8
