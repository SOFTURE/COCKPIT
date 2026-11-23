# Plan: repository-picker

## Approach
`listReadableRepositories(client)` in `src/forge/repositories.ts` reads `/user/repos` (100 per page, at most 5 pages,
archived ones left out) and returns the full names sorted. `loadRepositorySuggestions` (server only) drops the
watched ones and answers `listed` or `unavailable` (no token, or the read failed). The add form's field becomes a
combobox: theme-notion's `Command` with its search input (`name="repository"`, label "Repository") and a dropdown list
filtered as the owner types. Picking fills the field; Enter with nothing highlighted, or the Add button, submits as
before, so a typed `owner/name` still works.

## Key decisions
- `/user/repos` with a fine-grained token lists only the repositories granted to it, which is the set COCKPIT can
  watch; the hint says a missing repository has to be added to the token.
- The field keeps its label, name and the Add button, so every spec that types a name keeps working.
- No caching: the list is read when Settings renders (one to five requests).

## Phase 1: Repository picker

- Files: `src/forge/repositories.ts`, `src/projects/load-repository-suggestions.ts`, `src/projects/repository-picker.tsx`,
  `src/projects/add-repository-form.tsx`, `app/(app)/settings/page.tsx`, `messages/en.ts`, `e2e/fake-forge.ts`,
  `e2e/repository-picker.spec.ts`, `tests/forge/repositories.test.ts`, `README.md`, `CHANGELOG.md`.
- Mode: TDD for the listing, test-after for the field.
- Done when: unit tests for paging, archived and failure cases; an e2e that finds a repository by a fragment, picks it,
  adds it and no longer sees it offered; the existing specs green; screenshots of the open list in light and dark at
  1280 and 390 px inspected; gates green; CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Repository picker

#### Automated
- [ ] 1.1 Listing tests red, then `listReadableRepositories` green
- [ ] 1.2 Combobox field with suggestions, manual entry kept
- [ ] 1.3 e2e: picker spec and the full suite green on a production build
- [ ] 1.4 Screenshots 1280/390 light/dark inspected and stored as evidence
- [ ] 1.5 Gates green: typecheck, lint (language scan), test, doctor
