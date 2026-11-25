# Plan: owner-adds-watched-repositories

## Goal
The owner adds `owner/name` repositories on the Settings screen and removes them; COCKPIT checks it can read each
one's `context/state.json`, marks "no state yet" where it is missing, names any missing permission, and the watched
projects appear in the sidebar. Out of scope: the scan and its schedule (CMP-3), the inbox entries (CMP-4), the
overview (CMP-6), the full project page (CMP-9).

## Approach
**Starting point:** the shell passes `projects={[]}` to the sidebar (`app/(app)/layout.tsx`); no app table exists.

**Chosen:** COCKPIT's first own module `modules/projects` (schema `projects`, table `repositories`, one migration),
shaped like the example app's guestbook module; a forge client in `src/forge/` over `requestJson` with the token from
`FORGE_TOKEN` and the API base from `FORGE_API_URL`; an access check that probes the five read permissions; server
actions on the Settings screen behind `requireUser()`; a fake forge HTTP server for the e2e.
Rejected: watched repositories in an environment variable (FR-2: adding one must not need a redeploy); probing the
issues write permission with a real write (COCKPIT never writes except cockpit issues).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Unreadable repository | not added; the error names Metadata (404) or the refused permission | FR-2 "not added (or marked)" | PRD |
| Readable, some read permission missing | added and marked with the missing permissions | the owner sees what to fix without losing the entry | plan |
| No `context/state.json` | added, marked "no state yet" with the hint to update `@softure-ai/skills` | FR-2 | PRD |
| Permission names | Metadata, Contents, Issues, Pull requests, Actions (from `X-Accepted-GitHub-Permissions`, else the probe's own) | NFR-5 names | research |
| Unique key | lower-cased `owner/name`, a database `UNIQUE` constraint | invariant in the database | conventions |
| Sidebar link | `/projects/<owner>/<name>`, a minimal page (name and access) until CMP-9 | no dead links | plan |

## Phase 1: Forge access check and the projects module
**Discipline:** TDD. **Files:** `src/forge/client.ts`, `src/forge/permissions.ts`, `src/forge/repository-name.ts`,
`modules/projects/**`, `softure.config.ts`, `context/workflow.json`, `.env.example`, `tests/forge/**`,
`tests/projects/**`.

1. `src/forge/repository-name.ts`: `parseRepositoryName(input)` → `Result<{ owner, name, fullName }>`; trims, accepts
   `owner/name` only (forge name rules), lower-cases the key.
2. `src/forge/client.ts`: `createForgeClient({ token, baseUrl, fetch })` with `getRepository` and `probe(path)`.
3. `src/forge/permissions.ts`: `checkRepositoryAccess(client, name)` → `{ kind: "unreadable", missing }` or
   `{ kind: "readable", hasState, missing, defaultBranch }`.
4. `modules/projects`: migration `0001_create_repositories.sql` (Rollback comment), schema, queries
   (`findRepositories`, `insertRepository`, `deleteRepository`), health check.

**Tests:** `tests/forge/repository-name.test.ts`, `tests/forge/permissions.test.ts` (fakeFetch: readable with
state, no state, 404 repository, 403 contents with the header, 403 actions without the header, 401 token),
`tests/projects/queries.test.ts` (insert, duplicate refused by the constraint, delete, list in name order).

**Done when:**
- Automated: the tests above pass; `npm run migrate` applies the module migration; Gates green (typecheck, lint,
  test).

## Phase 2: Settings screen and sidebar
**Discipline:** test-after. **Files:** `app/(app)/settings/**`, `app/(app)/layout.tsx`,
`app/(app)/projects/[owner]/[name]/page.tsx`, `src/projects/**`, `messages/en.ts`, `e2e/**`, `playwright.config.ts`.

1. `src/projects/add-repository.ts`: `addRepository({ db, client, input })` (parse, check, insert) and
   `removeRepository`; server actions in `app/(app)/settings/actions.ts` call `requireUser()` first.
2. Settings: a "Watched repositories" section with the add form and the list (status word and icon, missing
   permissions, remove button).
3. Layout: the sidebar lists the watched repositories.
4. `e2e/fake-forge.ts`: a fake forge with fictional repositories; `e2e/watched-repositories.spec.ts`.

**Tests:** `tests/projects/add-repository.test.ts`; the e2e: add a readable repository → it shows in the sidebar;
add one without state → "No state yet"; add one with a refused permission → the permission is named and it is not
added; remove one → it leaves the sidebar.

**Done when:**
- Automated: the e2e passes; Gates green (typecheck, lint, test).
- Manual: the Settings screen renders on the theme in light and dark at 390 px and desktop (evidence: Playwright
  screenshots the run inspects).

## Risks and rollback
- The fake forge drifts from the real API → the check depends on statuses and one documented header only.
- Rollback: revert the merge; drop `projects.repositories` per the migration's Rollback comment.

## Decisions (auto)
- Issues write is not probed (it would need a write); CMP-5 reports a refused write when the first answer is sent.
- Removing a project deletes its row; its answers live in the answer history (CMP-5) keyed by the repository name,
  so they stay.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Forge access check and the projects module

#### Automated
- [x] 1.1 `tests/forge/**` pass: name parsing, access check for readable, no state, unreadable, refused permission named — 36f1f26
- [x] 1.2 `tests/projects/queries.test.ts` passes: insert, duplicate refused, delete, list — 36f1f26
- [x] 1.3 Gates green (typecheck, lint, test) — 36f1f26

### Phase 2: Settings screen and sidebar

#### Automated
- [x] 2.1 `tests/projects/add-repository.test.ts` passes — fba5aed
- [x] 2.2 `e2e/watched-repositories.spec.ts` passes: add readable (sidebar), no state marked, refused permission named, remove — fba5aed
- [x] 2.3 Gates green (typecheck, lint, test) — fba5aed

#### Manual
- [x] 2.4 The Settings screen renders on the theme in light and dark at 390 px and desktop (evidence: Playwright screenshots the run inspects; verified by the run 2026-11-23: light 390 and 1280, dark 390 and 1280, statuses with word and icon, no overflow) — fba5aed
