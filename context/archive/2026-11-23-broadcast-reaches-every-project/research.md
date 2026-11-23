# Research: broadcast-reaches-every-project

## How it works today
- The one write toward watched repositories is `ForgeClient.createIssue` (`src/forge/client.ts`); NFR-7 is guarded by
  `tests/forge/no-other-writes.test.ts`, which calls every client method and allows only `POST /repos/<o>/<n>/issues`.
  A broadcast needs no new client method: `hasLabel`, `createIssue` and `listOwnerWordIssues` cover it.
- `answerEntry` (`src/decisions/answer-entry.ts`) claims a row first (unique index), checks the label, creates the
  issue, and on a lost answer (`unavailable`, `invalid_answer`) or a stale claim (`STALE_CLAIM_MS`) adopts an
  owner-word issue it finds by its marker instead of creating a second one. A broadcast send per project needs the
  same three guards; unlike an answer, a failed send stays visible (with its reason) instead of being released.
- The scan stores each project's owner-word issues, open and closed, in `projects.reads.issues`
  (`src/scan/scan-projects.ts`); the inbox derives "done" from a closed issue there (`src/inbox/build-inbox.ts`).
  A broadcast page can do the same: no forge call while rendering.
- `parseOwnerWordMarker` matches only `<!-- owner-word: ... -->`, so a broadcast issue (its own marker) never passes
  for an answer in the inbox.
- Navigation is `src/shell/navigation.ts` (keys, hrefs) plus icons in `src/shell/app-sidebar.tsx`; copy lives in
  `messages/en.ts`, one namespace per feature.
- Migrations: `modules/projects/migrations/0001…0004`; the Drizzle view is `modules/projects/schema.ts`; the module
  lists its tables in `modules/projects/index.ts`.
- Tests: `tests/support/memory-forge.ts` is a stateful fake for one repository; `tests/support/test-context.ts` gives
  a migrated PGlite. e2e: `e2e/fake-forge.ts` serves fictional repositories and records created issues
  (`GET /__issues/<o>/<n>`); specs run fully parallel on one database, so each spec uses its own repositories.

## SOFTURE modules
Nothing in `@softure-ai/*` fans a message out to repositories; the forge client is the app's own. UI stays on
`@softure-ai/theme-notion` components (Card, Checkbox, Field, Input, Textarea, Button, PageHeader).

## Unknowns from the roadmap
- GitHub issue trigger limited to the `owner-word` label: a question for the wake-up task, which is CV-2 and is
  tracked in SOFTURE/SKILLS#81. Not needed here.
- A ready wake-up task brief in `@softure-ai/skills`: already filed as SOFTURE/SKILLS#81.
- Does a broadcast follow "owner-word = one decision"? Yes: the managed block defines an owner-word issue as "one
  decision, its scope and any limit"; a broadcast is one order to the project, written by the owner. No SKILLS note
  is needed now; CV-2 revisits it if a coordinator mishandles one.

## Risks
- A duplicate issue in several repositories: guarded by a unique (broadcast, project) row claimed before the forge
  call, a client-made broadcast id that makes a resubmitted form the same broadcast, and marker adoption on lost
  answers and stale claims.
- Parallel e2e specs: the broadcast form lists every watched repository; the spec must send only to its own.
- CV-3 (Polish) and CV-4 (layout) run in parallel and touch `messages/en.ts` and page wrappers: this change adds its
  own keys only and uses the page wrapper the other pages use today.
