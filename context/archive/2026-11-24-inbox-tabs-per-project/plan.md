# Plan: inbox-tabs-per-project

## Approach
A pure function `buildInboxTabs` (`src/inbox/inbox-tabs.ts`) turns the inbox rows into the tab list (key, label,
count, href) and the shown tab: "All" first, then one tab per project with entries (waiting or later), ordered by
label. A project's label comes from `getProjectTabLabels` (same file): the initials of the repository name's words
(split on `_`, `-`, `.`), the bare name when it is a single word, and the bare name for every project whose code
would repeat another's. The page reads `searchParams.project`, draws `TabBar` and filters the waiting, later and
history cards to the shown project; rows inside a project tab hide the project name and the waiting card names the
repository.

## Key decisions
- Tab key and address: `all` or the repository full name (`?project=owner/NAME`); unknown → All.
- Counter: entries waiting (not later); All counts every waiting entry.
- A project with only later entries still gets a tab (counter 0).
- Icons: `Inbox` for All, `FolderGit2` for a project.

## Phase 1: Tabs in the inbox

- Files: `src/inbox/inbox-tabs.ts`, `tests/inbox/inbox-tabs.test.ts`, `app/(app)/inbox/page.tsx`, `messages/en.ts`,
  `messages/pl.ts`, `e2e/inbox.spec.ts`, `CHANGELOG.md`.
- Mode: TDD for `buildInboxTabs` and the labels (initials, single word, collision, owner prefix dropped, counts,
  later-only project, requested / unknown tab).
- Done when: unit tests green; e2e opens a project tab by link, sees only that project's rows without the project
  name, and the 390 px page has no horizontal scroll; screenshots at 1280 and 390, light and dark, inspected and
  stored as evidence; gates (typecheck, lint, test), build and the full e2e green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Tabs in the inbox

#### Automated
- [x] 1.1 `buildInboxTabs` unit tests red, then green (`tests/inbox/inbox-tabs.test.ts`, 8/8) — 562bfd1
- [x] 1.2 Inbox page draws `TabBar` and filters the cards to the shown project — 562bfd1
- [x] 1.3 e2e updated and green; full suite on a production build 65/65 — 562bfd1
- [x] 1.4 Screenshots light/dark at 1280 and 390 inspected and stored (`cockpit/evidence/inbox-tabs-per-project/{01-inbox-all-tab,02-inbox-project-tab}-after-{1280,390}-{light,dark}.webp`) — 562bfd1
- [x] 1.5 Gates green: typecheck, lint (language scan), test (532/532), doctor — 562bfd1
