# Plan: package-updates-in-one-view

## Approach
A new adapter `packages` (`src/adapters/packages/**`) reads per project during the scan: the newest package-update
pull request and, when it is open, the Actions runs of its head; `context/workflow.json` → held packages;
`package.json` and `package-lock.json` → the `@softure-ai/*` versions; and the npm registry's `latest` per package
(per-scan cache, `NPM_REGISTRY_URL`). A Packages page (`app/(app)/packages/page.tsx`) lists every watched project
with its update, held packages with issue links, and versions with "behind" marked. One sidebar entry.

## Key decisions
- See research.md → Decisions (auto). No migration, no write, no new token scope (NFR-7).
- Versions compare numerically (major.minor.patch, a prerelease below its release); no new dependency.

## Phase 1: Adapter and view (TDD)
- Files: `src/adapters/packages/{packages-state,read-packages,npm-registry,versions,issue-link,packages-adapter,packages-view}.ts`,
  `src/jobs/handlers.ts`, `tests/adapters/read-packages.test.ts`, `tests/adapters/packages-view.test.ts`.
- Done when: tests cover a merged update, a red open one (failing job named), an open green one, none, held entries,
  a behind and a current version, a missing lockfile, an npm failure (newest unknown) and one registry call per
  package across two projects, an unreadable manifest, absent, and a rate limit.

## Phase 2: Page, navigation, copy, e2e
- Files: `app/(app)/packages/page.tsx`, `src/adapters/packages/{load-packages.ts,packages-details.tsx}`,
  `src/shell/navigation.ts`, `src/shell/app-sidebar.tsx`, `messages/en.ts`, `messages/pl.ts`, `e2e/fake-forge.ts`,
  `e2e/fixtures.ts`, `playwright.config.ts`, `e2e/packages.spec.ts`, `README.md`, `CHANGELOG.md`.
- Done when: the e2e with fictional projects (merged update, red update, held package, no update yet) and a fake
  registry shows the states, the issue link and a behind version; screenshots light/dark at 1280 and 390 inspected
  and stored; gates, build and e2e green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Adapter and view

#### Automated
- [x] 1.1 `packages` adapter with tests (update states, held, versions, npm cache and failure, absent, unknown, rate limit) (`tests/adapters/read-packages.test.ts`, 16/16; tests written right after the code, impl-review W-1) — e468c80
- [x] 1.2 View from the stored read with tests; adapter wired into the scan (`tests/adapters/packages-view.test.ts`, 7/7; `src/jobs/handlers.ts`) — e468c80

### Phase 2: Page, navigation, copy, e2e

#### Automated
- [x] 2.1 Packages page, sidebar entry, en and pl copy (`tests/shell/navigation.test.ts`, `e2e/sign-in.spec.ts`, `e2e/polish.spec.ts` green) — e468c80
- [x] 2.2 e2e: four fictional projects and a fake registry show their states, and the page fits 390 px without horizontal scroll (`e2e/packages.spec.ts`, 2/2) — e468c80
- [x] 2.3 Screenshots light/dark at 1280 and 390 inspected and stored (`cockpit/evidence/package-updates-in-one-view/01-packages-after-{1280,390}-{light,dark}.webp`) — e468c80
- [x] 2.4 Gates green: typecheck, lint (language scan), test (466/466), build, e2e (61/61, and 61/61 with 4 workers) — e468c80
