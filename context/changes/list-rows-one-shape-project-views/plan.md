# Plan: list-rows-one-shape-project-views

## Approach
Move every remaining data list onto CT-18's `ListRow`, and every result chip onto `ResultBadge` through one tone map.

- `src/status/state-colors.ts` becomes a tone map (`getRunTone`, `getDoctorTone`, `getHealthTone`,
  `getPackageVersionTone`, `getDeployResultTone` → `ResultTone`): passed/ok/healthy/current success, failed/failing/
  unhealthy danger, behind warning, running/pending/cancelled/none/unknown muted. Chips render `ResultBadge` and keep
  `data-tone` as the badge's colour name (`getResultColor`), so e2e selectors stay.
- Rows: the overview row opens the project (whole row lit), its project status and drift on top of the right column,
  the property chips in a `relative` line under the name so their own links stay clickable. Inbox rows: entry text
  left, the answer state (`AnswerStateBadge`: done success, sent muted with Send, sending muted, deferred muted with
  Clock) on top of the right column, the answer controls, issue link and fires under it. Project page roadmap items
  (status pill right), queued roadmaps (href, progress right), changes (stage right). History: runs (result right,
  the run opens on the forge), merges and releases (state right, opens on the forge), doctor findings (code right).
  Deploys (row opens the project; last deploy result right; release/production tags and the rest in details).
  Packages: version rows (behind/current right), held packages (held badge right).

## Key decisions
- Running and pending show gray (CT-18's map: pending is gray). Blue leaves the result chips.
- Rows whose link leaves the app (forge runs, merges, releases) use `isExternal`: no arrow, new tab.
- `settings-row.tsx` stays: a setting with its one control, not a data list.
- The inbox's open answer form sits in the right column; on narrow widths it wraps under the text.

## Phase 1: one tone map
- Files: `src/status/state-colors.ts`, `tests/status/state-colors.test.ts`, chips in `overview-row.tsx`,
  `health-chip.tsx`, `wake-chip.tsx`, `deploy-details.tsx` result badge.
- Mode: TDD (the unit test changes first).
- Done when: the unit test pins every state's tone; chips render `ResultBadge`.

## Phase 2: the lists use ListRow
- Files: `src/overview/overview-row.tsx`, `src/inbox/inbox-row.tsx`, `src/inbox/answer-state-badge.tsx` (new),
  `app/(app)/inbox/page.tsx`, `src/project-page/project-page-sections.tsx`,
  `src/project-page/history/history-sections.tsx`, `src/adapters/deploy/deploys-list.tsx`,
  `src/adapters/packages/packages-details.tsx`, related unit and e2e tests, `CHANGELOG.md`.
- Mode: test-after (layout).
- Done when: a grep finds no `<li` data row outside `ListRow` on these screens; e2e reads the state in the right column
  (`expectStateInRightColumn`) on overview, inbox, project page, history, deploys and packages; all e2e pass;
  screenshots at 1280 and 390 px, light and dark, looked at and stored in the evidence folder.

## Phase 3: gates and review
- Gates (typecheck, lint, unit), build + e2e, doctor; SOFTURE/AI issue for any design-system gap found.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: one tone map

#### Automated
- [ ] 1.1 Unit test pins the tone of every run, doctor, health, package and deploy state
- [ ] 1.2 Overview, health, wake and deploy chips render `ResultBadge`

### Phase 2: the lists use ListRow

#### Automated
- [ ] 2.1 Overview, inbox, project page, history, deploys and packages rows use `ListRow`
- [ ] 2.2 e2e: state in the right column on each screen at 1280 and 390 px; full e2e green
- [ ] 2.3 Screenshots at 1280 and 390 px, light and dark, looked at and stored

### Phase 3: gates and review

#### Automated
- [ ] 3.1 Gates, build, e2e and doctor green
