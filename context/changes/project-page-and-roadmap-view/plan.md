# Plan: project-page-and-roadmap-view

## Approach
Phase 1 rebuilds the project page as a column of theme-notion cards (as Settings): a page header with the
repository name, a breadcrumb to Projects and the two actions (repository, history) as outline buttons; a status
line; then cards "Waiting for you" (only when something waits), "Active roadmap", "Queued roadmaps",
"Open changes", and "Production" (health and deploy, only when either reports). A roadmap is a row with its title,
a `MiniProgress` of done/total and the start condition, linking to the in-app roadmap view. Entries reuse the inbox
row without the project chip.

Phase 2 adds `/projects/<owner>/<name>/roadmaps/<slug>`: a pure parser (`src/roadmap/parse-roadmap.ts`) turns the
roadmap markdown into frontmatter, title, run-wide orders, at-a-glance rows and item blocks with their fields, and
the open checkbox sections; the page reads the file through a new `getTextFile` on the forge client (contents API,
base64), merges rows and blocks by ID and renders each item as a `FoldRow` (ID, title, status badge; details:
outcome, prerequisites, size, change, unknowns, risk and the other fields). A failed read or an unparseable file
shows a notice and the state's items.

## Key decisions
- Parse in COCKPIT, tolerant: the at-a-glance table is the contract (`context_state.py`), item blocks are optional
  enrichment; unknown fields are shown under their own label.
- Inline markdown (code, bold, links to http(s)) renders as React nodes, never as HTML.
- Slug: the state's roadmap slug; an active roadmap without a slug is `active`.
- "Waiting for you" moves to the top: it is the page's reason to exist (PRD: what waits for the owner).

## Phase 1: Project page as cards
- Files: `app/(app)/projects/[owner]/[name]/page.tsx`, `src/project-page/project-page-sections.tsx`,
  `src/project-page/build-project-page.ts`, `src/inbox/inbox-row.tsx`, `messages/en.ts`, `e2e/project-page.spec.ts`,
  tests in `tests/project-page/`.
- Mode: test-after (layout; behaviour covered by unit tests of the builder and the e2e spec).
- Done when: unit tests for the roadmap hrefs pass; the project-page e2e spec passes on a production build;
  screenshots at 1280 and 390 px, light and dark, are inspected and stored as evidence.

## Phase 2: Roadmap view
- Files: `src/roadmap/**`, `src/forge/client.ts`, `app/(app)/projects/[owner]/[name]/roadmaps/[slug]/page.tsx`,
  `messages/en.ts`, `e2e/fake-forge.ts`, `e2e/roadmap-view.spec.ts`, `tests/roadmap/**`, `tests/forge/**`.
- Mode: TDD for the parser and the text read; test-after for the page.
- Done when: parser tests cover a full roadmap, a wrapped field, a missing block, an empty file and a file without
  a table; the e2e spec opens a queued and the active roadmap from the project page and sees parsed items, and sees
  the fallback when the file is refused; screenshots inspected and stored; gates and the full e2e green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Project page as cards

#### Automated
- [ ] 1.1 Project page rebuilt as cards; roadmaps link to the in-app view; entries without the project chip
- [ ] 1.2 Unit tests and the project-page e2e spec green on a production build
- [ ] 1.3 Screenshots 1280/390 light/dark inspected and stored as evidence

### Phase 2: Roadmap view

#### Automated
- [ ] 2.1 Roadmap parser and forge text read with unit tests
- [ ] 2.2 Roadmap view page with fallback to the state's items
- [ ] 2.3 e2e roadmap view spec and the full e2e green on a production build
- [ ] 2.4 Screenshots 1280/390 light/dark inspected and stored as evidence
- [ ] 2.5 Gates green: typecheck, lint (language scan), test, doctor
