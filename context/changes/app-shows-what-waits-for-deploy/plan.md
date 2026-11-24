# Plan: app-shows-what-waits-for-deploy

## Goal
A Deploys page lists every watched app that has a deploy workflow with its last release, its version in production
and last deploy, the pull requests merged into the main branch since that release, and the required secrets added
since the deployed tag; an app with new required secrets is marked "will stop at the secret check".

## Approach
Extend the deploy adapter's read with one optional `waiting` fact set, computed from three more forge reads (compare,
compose at the main branch, compose at the deployed tag); show it on a new `/deploys` page built from the stored
reads. No migration (adapter values are JSON).

## Phase 1: What waits, in the deploy adapter (TDD)
- `src/adapters/deploy/required-secrets.ts`: `getRequiredNames(compose)`: the sorted distinct names of `${NAME:?…}`
  and `${NAME?…}`, skipping `$${…}`.
- `src/adapters/deploy/merged-changes.ts`: `countMergedPullRequests(messages)`: distinct pull request numbers named on
  first lines (`Merge pull request #N`, `… (#N)`).
- `deploy-state.ts`: `waiting` (optional, nullable): `release` (newest non-draft tag or null), `merged`
  (`{ count, isLowerBound }` or null when unknown or no release), `secrets` (`{ since, added }` or null when no
  deployed tag or a compose file is unreadable).
- `read-deploy.ts`: releases keep their tag and draft flag; reads compare and both compose files; a rate limit on any
  of them returns `rate_limited`.
- Done when: unit tests cover parsing (both forms, `$${`, comments, duplicates, none), counting (merge, squash,
  duplicates, no reference), and the read (up to date, three merged, new secret, capped compare, compose missing,
  no production, extra read rate-limited, failed extra reads leave facts unknown); gates green.

## Phase 2: The Deploys page
- `src/adapters/deploy/load-deploys.ts` (all watched repositories with their deploy view, `none` left out, sorted by
  name), `src/adapters/deploy/deploys-list.tsx`, `app/(app)/deploys/page.tsx`, a `deploys` entry in
  `src/shell/navigation.ts` (icon in `app-sidebar.tsx`), own keys in `messages/en.ts` and `messages/pl.ts`.
- Fake forge: a compare route and files by ref; three fictional apps (harbor-app up to date, harbor-web with three
  merged pull requests, harbor-api whose compose gained a `${NAME:?}` line).
- Done when: `e2e/deploys.spec.ts` shows the count and the new secret's name and the warning; a page view test
  covers the view helpers; screenshots at 1280 and 390 px, light and dark, inspected; gates and e2e green.

## Risks and rollback
Three more reads per project with a deploy workflow and scan; projects without one still cost one read. Rollback:
revert the merge; stored values without `waiting` still parse.

## Decisions (auto)
- Compose path is the `env render` default `docker/prod/docker-compose.yml`; no `deploy.yml` parsing.
- "Merged changes" are distinct pull request numbers in the compare commits; a list shorter than `ahead_by` shows
  "at least N".
- Secrets compare the main branch against the deployed (production) tag, the set the last deploy rendered; without a
  known production tag the line is not shown.
- The page says "check it is set" for each new name: secret values are not readable with least privilege.
- `waiting` is shown on the Deploys page only; the project page keeps its section unchanged.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: What waits, in the deploy adapter

#### Automated
- [ ] 1.1 Parser, counter and read tests pass
- [ ] 1.2 Gates green (typecheck, lint, test)

### Phase 2: The Deploys page

#### Automated
- [ ] 2.1 `e2e/deploys.spec.ts` passes: up to date, three merged, new secret warned; full e2e green
- [ ] 2.2 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.3 The page renders in light and dark at 1280 and 390 px (evidence: Playwright screenshots the run inspects, `cockpit/evidence/app-shows-what-waits-for-deploy/`)
