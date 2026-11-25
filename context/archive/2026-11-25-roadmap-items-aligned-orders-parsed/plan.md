# Plan: roadmap-items-aligned-orders-parsed

## Approach
Each item row's summary becomes one CSS grid: a fixed ID column (the ID in a tag badge), the content column (title,
then status detail, then the outcome) and an auto status column on the title's line; on a phone the status moves
under the title in the content column. The chevron aligns with the first line instead of the row's middle. The
project page's roadmap list uses the same ID badge, so IDs look alike across the app.

The order parser splits a `> - label: text` line at the first colon outside backticks. A trailing parenthetical in
the label (`(`Mode: owner`)`) becomes the order's `note`, shown under its value. The view translates known labels
(Push main branch, Archive roadmap, Release, Parallelism, Owner at the keyboard, Start) and the simple values the
roadmap skill writes (`no`, `at the end`, `after each item`, `up to N at once`) through the message dictionaries;
anything else shows as written.

## Key decisions
- One grid in the summary, not padding offsets (`pl-16`): every column lines up whatever the ID's length.
- Translation of an order is a pure function (`describeOrder`) with a unit test; unknown labels pass through.

## Phase 1: Items grid, ID badge, orders parsed and translated

- Files: `src/roadmap/parse-roadmap.ts`, `src/roadmap/describe-order.ts`, `src/roadmap/roadmap-view.tsx`,
  `src/project-page/project-page-sections.tsx`, `messages/en.ts`, `messages/pl.ts`,
  `tests/roadmap/parse-roadmap.test.ts`, `tests/roadmap/describe-order.test.ts`, `e2e/fake-forge.ts`,
  `e2e/project-page.spec.ts`, `CHANGELOG.md`.
- Mode: TDD.
- Done when: a parser test with a label carrying code and a colon fails before and passes after; `describeOrder`
  tests pin the Polish labels and values and the pass-through; the roadmap e2e checks the parsed order and the ID
  badge on a production build; screenshots light/dark at 1280 and 390 are inspected and stored as evidence; gates
  green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Items grid, ID badge, orders parsed and translated

#### Automated
- [x] 1.1 Parser test for an order label with code and a colon red, then green (`tests/roadmap/parse-roadmap.test.ts`: label read as "Owner at the keyboard (`Mode" before, whole with its note after; 10/10) — c5606d4
- [x] 1.2 `describeOrder` unit tests (Polish labels and values, pass-through) green (`tests/roadmap/describe-order.test.ts` 3/3) — c5606d4
- [x] 1.3 Items rows on one grid with the ID badge; roadmap e2e updated and green on a production build (`e2e/project-page.spec.ts` 8/8, `e2e/polish.spec.ts` 3/3: the parsed order, its note and the ID tags asserted) — c5606d4
- [x] 1.4 Screenshots light/dark at 1280 and 390 inspected and stored (`cockpit/evidence/roadmap-items-aligned-orders-parsed/0{1,2}-{roadmap-view,project-page}-after-{1280,390}-{light,dark}.webp`; before: the owner's screenshot) — c5606d4
- [x] 1.5 Gates green: typecheck, lint (language scan), test (613/613), doctor — c5606d4
