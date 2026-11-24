# Plan: context-drift-against-forge-flagged

## Approach
A pure function `findContextDrift` (`src/drift/find-context-drift.ts`) narrows the stored state and the stored
forge release (both `unknown`) and returns a list of drifts, each a discriminated union:
`release_not_settled` (the release, the waiting item IDs) and `finished_roadmap_live` (the roadmap slug and its
item count). The overview row carries `drift`; the row draws one orange chip per drift with the settle step as its
hint. The project page loads its forge facts and shows a notice under the read status naming each drift and what
settles it (`wt-roadmap.py released <tag>`, or closing the roadmap with `softure-roadmap`).

## Key decisions
- Dates, strictly after, per research; row date falls back to the owner queue's `release:` word entry.
- Finished = every row `done`/`dropped`/`carried`, at least one `done`.
- No status change, no migration, no MCP/CLI field (out of the item's outcome).
- Messages: own `drift` namespace in `messages/en.ts` and `messages/pl.ts`.

## Phase 1: Drift found and flagged

- Files: `src/drift/find-context-drift.ts`, `src/drift/drift-notice.tsx`, `tests/drift/find-context-drift.test.ts`,
  `src/overview/build-overview.ts`, `src/overview/overview-row.tsx`, `src/project-page/load-project-page.ts`,
  `app/(app)/projects/[owner]/[name]/page.tsx`, `messages/en.ts`, `messages/pl.ts`, `e2e/drift.spec.ts`,
  `tests/overview/build-overview.test.ts`, `CHANGELOG.md`.
- Mode: TDD for `findContextDrift` (settled, released but not settled, finished roadmap still live, waiting rows
  without dates, same-day release, no release, unreadable state); an overview test with three fictional projects
  shows two flags and one clean row; e2e shows the chip on the overview and the notice on the project page.
- Done when: unit tests green; e2e green on a production build; screenshots light/dark at 1280 and 390 inspected and
  stored as evidence; gates (typecheck, lint, test) and doctor green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Drift found and flagged

#### Automated
- [x] 1.1 `findContextDrift` unit tests red, then green (`tests/drift/find-context-drift.test.ts`, 12/12) — cdcc306
- [x] 1.2 Overview row carries the drift and draws a chip; overview test shows two flags and one clean row — cdcc306
- [x] 1.3 Project page shows the drift notice — cdcc306
- [x] 1.4 e2e for the overview chip and the project-page notice green (`e2e/drift.spec.ts`); full suite on a production build 61/61 — cdcc306
- [x] 1.5 Screenshots light/dark at 1280 and 390 inspected and stored (`cockpit/evidence/context-drift-against-forge-flagged/{01-overview,02-project-page}-after-{1280,390}-{light,dark}.webp`) — cdcc306
- [x] 1.6 Gates green: typecheck, lint (language scan), test (461/461), doctor — cdcc306
