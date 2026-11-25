# Plan: cockpit-issue-wakes-its-project

## Approach
Bump `@softure-ai/skills` to 0.35.0 (it ships the cockpit wake routine and the doctor check). Add a `wake` adapter
that reads each watched project's `context/workflow.json` → `autonomy.ownerWordWake` during the scan, stored in
`adapters.reads` like health and deploy. Show it as a chip on the overview row, a section with the setup link on the
project page, and next to each project on the broadcast page. README gets the setup steps; COCKPIT declares its own
wake-up in `context/workflow.json`.

## Key decisions
- Adapter, not a forge fact: no migration (see research).
- Three declared kinds plus "waits" for a missing key; `absent` when the project has no `workflow.json`.
- COCKPIT declares `"heartbeat"` until the owner creates its routine (research, Decisions).

## Phase 1: Skills bump, the wake adapter and its views (TDD)
- Files: `package.json`, `package-lock.json`, `AGENTS.md` (installer block), `context/workflow.json`,
  `src/adapters/wake/**`, `src/jobs/handlers.ts`, `src/overview/build-overview.ts`, `src/overview/overview-row.tsx`,
  `app/(app)/projects/**`, `src/broadcast/**`, `app/(app)/broadcast/[id]/page.tsx`, `messages/en.ts`,
  `messages/pl.ts`, `README.md`, `CHANGELOG.md`, `tests/adapters/wake/**`, `tests/overview/**`.
- Done when: unit tests with three fictional projects declaring routine, heartbeat and nothing give three different
  views; a missing file is absent, an invalid value unknown, a rate limit stops the scan; the overview row carries
  the wake view; `npx softure-skills doctor` passes on this repository with the new key.

## Phase 2: Pages and e2e
- Files: `e2e/**` (fake forge serves `context/workflow.json` for fixtures), page components.
- Done when: an e2e shows the three chips on the overview and the project page's section with the setup link;
  screenshots light/dark at 1280 and 390 inspected and stored as evidence; gates and e2e green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Skills bump, the wake adapter and its views

#### Automated
- [x] 1.1 `@softure-ai/skills` 0.35.0, installer block refreshed, `autonomy.ownerWordWake` declared (`"heartbeat"`), CI doctor pin 0.35.0, `npx softure-skills doctor` OK — 7a3bf35, 2ba835b
- [x] 1.2 `wake` adapter and view with tests (routine, heartbeat, none, undeclared, absent, invalid, rate limit) (`tests/adapters/read-wake.test.ts`, 10/10) — 2ba835b
- [x] 1.3 Overview row, project page and broadcast page show the wake view; en and pl copy; README steps (`tests/overview/build-overview.test.ts`, `tests/broadcast/build-broadcast-view.test.ts`) — 2ba835b

### Phase 2: Pages and e2e

#### Automated
- [x] 2.1 e2e: three fixtures show three chips; project page shows the setup link (`e2e/wake.spec.ts`, 1/1) — 2ba835b
- [x] 2.2 Screenshots light/dark at 1280 and 390 inspected and stored (`cockpit/evidence/cockpit-issue-wakes-its-project/0{1-overview,2-project-page}-after-{1280,390}-{light,dark}.webp`) — 2ba835b
- [x] 2.3 Gates green: typecheck, lint (language scan), test (440/440), build, e2e (59/59) — 2ba835b
