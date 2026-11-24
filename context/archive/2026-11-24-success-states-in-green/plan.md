# Plan: success-states-in-green

## Approach
One module, `src/status/state-colors.ts`, maps each state to its palette colour (`getRunColor`, `getDoctorColor`,
`getHealthColor`, `getPackageVersionColor`, `getDeployResultColor` reusing the deploy step looks). The chips call it
and expose the colour as `data-tone`, so a unit test pins every state and the e2e can assert the colour on a
production build. `STATUS_LOOKS.idle` and the sidebar icon class turn blue.

## Key decisions
- Fix in COCKPIT, not in the shared theme: the theme only offers colours; the choice is the app's.
- Running and pending are blue, as elsewhere in the app; cancelled, unknown, none and not read stay grey.
- Idle and moving are both blue; their icons (moon, arrow) and words keep them apart.

## Phase 1: Success in green

- Files: `src/status/state-colors.ts`, `tests/status/state-colors.test.ts`, `src/overview/overview-row.tsx`,
  `src/adapters/observability/health-chip.tsx`, `src/adapters/packages/packages-details.tsx`,
  `src/adapters/deploy/deploys-list.tsx`, `src/status/status-look.ts`, `src/status/project-status-badge.tsx`,
  e2e specs that assert the tones, `CHANGELOG.md`.
- Mode: TDD.
- Done when: the unit test pins every state's colour; e2e asserts `data-tone` green on a current package, a passed
  CI chip, an OK doctor, a healthy project and blue on the idle sidebar icon; screenshots before/after inspected and
  stored as evidence; gates green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Success in green

#### Automated
- [x] 1.1 Unit test of the state colours red, then green (`tests/status/state-colors.test.ts`, failed without the module, 6/6 after) — acab672
- [x] 1.2 Chips, packages, deploys and idle icon use the colours; e2e asserts the tones (overview, health, deploys, deploy, packages: 7/7 on a production build) — acab672
- [x] 1.3 Screenshots before/after inspected and stored as evidence (`cockpit/evidence/success-states-in-green/0{1,2,3}-{packages,projects,deploys}-{before,after}-{1280,390}-{light,dark}.webp`) — acab672
- [x] 1.4 Gates green: typecheck, lint (language scan), test (608/608), doctor — acab672
