# Plan: production-deploy-card-readable

## Approach
`DeployDetails` renders two cards side by side (one column on a phone): "In production" with the version large and
the time it was deployed, tinted green when a version is known; "Last deploy" with its version, its time, the link
to its run, and its steps as filled status badges with an icon each, coloured by state. A failed last deploy tints
its card red, a running one blue. The look of each state is one table (`DEPLOY_STEP_LOOKS`) the tests read.

## Key decisions
- Filled tag badges (`Badge variant="tag"`) with an icon, not ghost `Status` words: the owner asked for success "on
  green", and a filled badge reads as a state at a glance; the icon keeps the state readable without colour.
- Skipped verification is amber (`yellow` in the palette), failure red, cancelled grey, running blue.
- Messages split the label from the value ("In production" / "v2.1.0"), so the version can be set large.

## Phase 1: Deploy cards

- Files: `src/adapters/deploy/deploy-details.tsx`, `src/adapters/deploy/deploy-step-looks.ts`,
  `tests/adapters/deploy-step-looks.test.ts`, `messages/en.ts`, `messages/pl.ts`, `e2e/deploy.spec.ts`,
  `CHANGELOG.md`.
- Mode: TDD.
- Done when: a unit test pins every state's colour (passed green, skipped yellow, failed red); the deploy e2e checks
  the cards, versions and the states' colours on a production build; screenshots light/dark at 1280 and 390 are
  inspected and stored as evidence; gates green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Deploy cards

#### Automated
- [ ] 1.1 Unit test of the state looks red, then green
- [ ] 1.2 Deploy block as two cards with coloured step badges; deploy e2e updated and green
- [ ] 1.3 Screenshots light/dark at 1280 and 390 inspected and stored
- [ ] 1.4 Gates green: typecheck, lint (language scan), test, doctor
