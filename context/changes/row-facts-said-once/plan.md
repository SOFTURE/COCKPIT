# Plan: row-facts-said-once

## Approach
Apply CT-22's second row rule to every list the audit (research.md) found repeating itself. Answered inbox rows (the
inbox, the project page and "Answered earlier") get one shared `AnswerFacts` line in their details: the answer's issue
link and who answered; the state line holds the answer badge and the issue's fire badges, the controls line only
Retry. A put-off row keeps its "Put off" badge alone and names its issue in the details. Held packages move the issue
(or "no issue named") next to "since" in the details. Merges, releases and the last package update keep their state
badge and lose the verb on their time line. Scan status says "Checked <time>" under its "Read" badge and drops the
second "Not read yet". Clean lists stay as they are; their verdicts are in research.md.

## Key decisions
- An issue link is a reference, not a control: it moves to the details (change.md Layout).
- The fires of an answer's issue are its state: `IssueFireBadges` on line 1, `RetryWakeForm` on line 2, both reused
  from `wake-chip.tsx` without editing it (CT-23 owns it).
- The overview keeps its reason lines: they are the why of the Broken status and the next step, not a value a chip
  already shows in words; recorded as clean.
- Times without a verb ("Nov 24, 2026, 4:00 AM") sit under a badge that already names the event.
- One e2e spec (`e2e/row-facts.spec.ts`) on a new fictional project `example-org/row-facts-app` covers every touched
  screen with one helper (`e2e/expect-side-holds-state-and-controls.ts`): at 1280 and 390 px every text in a row's
  right column sits in a badge, a status or a control.

## Phase 1: Each fact once on every touched list

- Files: `src/inbox/answer-facts.tsx` (new), `src/inbox/answered-earlier-row.tsx` (new), `src/inbox/inbox-row.tsx`,
  `app/(app)/inbox/page.tsx`, `src/adapters/packages/packages-details.tsx`, `src/project-page/history/history-sections.tsx`,
  `src/scan/scan-project-row.tsx` (new), `app/(app)/scan-status/page.tsx`, `messages/en.ts`, `messages/pl.ts`,
  `tests/inbox/inbox-row-facts.test.tsx` (new), `tests/adapters/packages-details-facts.test.tsx` (new),
  `tests/project-page/history-row-facts.test.tsx` (new), `tests/scan/scan-project-row.test.tsx` (new),
  `e2e/fake-forge.ts`, `e2e/row-facts.spec.ts` (new), `e2e/expect-side-holds-state-and-controls.ts` (new),
  `e2e/scan-until-settled.ts`, `e2e/scan.spec.ts`, `e2e/header-refresh.spec.ts`, `CHANGELOG.md`.
- Mode: e2e first (written and run on the old code for the before screenshots), then code with unit tests.
- Done when: a unit test per moved fact asserts it appears once in the row (answered by, the answer's issue, the
  put-off issue, held issue / no issue, merged, published, package update time, read / checked, not read yet); the e2e
  asserts the right column holds only badges and controls on the inbox, Answered earlier, the project page's entries,
  its history tab and Packages, and Scan status, at 1280 and 390 px; screenshots of each touched screen at 1280/390
  light/dark before and after looked at and stored; gates green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Each fact once on every touched list

#### Automated
- [ ] 1.1 Fixture `row-facts-app` (+ `stateAfterIssues`) and `e2e/row-facts.spec.ts` with the right-column helper; before screenshots
- [ ] 1.2 Inbox rows: `AnswerFacts` in the details, fires on line 1, Retry on line 2; put-off issue in the details; Answered earlier the same
- [ ] 1.3 Held packages and last update; merges and releases; Scan status "Checked" and one "Not read yet"
- [ ] 1.4 Unit tests: each moved fact once per row
- [ ] 1.5 e2e green at 1280 and 390 px; existing specs updated (`CHECKED_AT`)
- [ ] 1.6 Screenshots 1280/390 light/dark before and after, looked at, stored in `/mnt/project-files/cockpit/evidence/row-facts-said-once/`
- [ ] 1.7 Gates green: typecheck, lint (language scan), test, e2e
