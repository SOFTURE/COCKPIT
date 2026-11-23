# Plan: deploy-state-adapter

## Goal
An optional deploy adapter shows on a project's page which version runs in production and whether the last deploy
and its verification passed, read from its deploy workflow runs and its release reports; projects without a deploy
workflow show nothing extra (FR-17). Out of scope: the overview row, the status rule, production wiring (CMP-23).

## Approach
**Starting point:** CMP-21's adapter contract and `adapters.reads`; the project page shows health.

**Chosen:** `src/adapters/deploy/` with `read-deploy.ts` (runs of `deploy.yml`, then releases), `release-report.ts`
(parses the `deployments` section of a release body), `deploy-state.ts` (schema, id `deploy`), `deploy-view.ts`
(stored read → view), `deploy-details.tsx` (the page section) and `load-deploy.ts`. The job handler adds the adapter
next to the observability one. No migration.
Rejected: reading the deploy-report artifact (a zip download per run); reading production's build info route (access
to servers, which the roadmap rules out); GitHub deployments API (environment refs are the branch for dispatch runs).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Source | `deploy.yml` runs + release report rows | the files `softure-deploy init` writes | research |
| No workflow / no runs | absent | FR-17: nothing extra | prd |
| Workflow read refused or broken | unknown with a reason code | FR-17 failure rule | prd |
| Releases read fails | runs only (report rows ignored) | the runs answer the main question | research |
| Status | unchanged | FR-8 has no deploy reason | prd |

## Phase 1: Deploy adapter and its storage in the scan
**Discipline:** TDD. **Files:** `src/adapters/deploy/{deploy-state,release-report,read-deploy,deploy-adapter}.ts`,
`src/jobs/handlers.ts`, `tests/adapters/release-report.test.ts`, `tests/adapters/read-deploy.test.ts`,
`tests/support/deploy-fixture.ts` (a body written by `softure-deploy release-report`).

**Tests:** report parsing (rows newest first, deployed / failed at step / verify icons, run id, rows outside the
section or malformed skipped, no section → none); read: no workflow (404) → absent with one call; no runs → absent;
runs refused → unknown `runs_unreadable`; rate limit → rate_limited; release run passed without reports → production
= its tag; dispatch run matched to a report row → version, verify, failed step; production from the newest deployed
production row while the last deploy failed; running run; releases read failing → runs only.

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Deploy state on the project page
**Discipline:** test-after for the view and the UI. **Files:** `src/adapters/deploy/{deploy-view.ts,load-deploy.ts,
deploy-details.tsx}`, the project page, `messages/en.ts` (`deploy.*`), `e2e/fake-forge.ts` (deploy runs and
releases), `e2e/deploy.spec.ts`, `tests/adapters/deploy-view.test.ts`, `README.md`.

**Tests:** view (none, value, unknown reasons, invalid stored value); e2e: a fixture project shows its production
version and a passed last deploy with verification; another shows a failed last deploy (`failed at migrate`) while
production still runs the earlier version; a project without a deploy workflow shows no Deploy section.

**Done when:**
- Automated: the tests and the e2e pass; Gates green.
- Manual: the section renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots
  the run inspects, saved to the project files).

## Risks and rollback
- Rollback: revert the merge; `DELETE FROM adapters.reads WHERE adapter = 'deploy';` (no schema change).

## Decisions (auto)
- Deploy state is shown on the project page only; the overview, the status and the digest stay unchanged.
- The release report is parsed locally (the package exports no reader); a COCKPIT-specific need, not a gap every app hits.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Deploy adapter and its storage in the scan

#### Automated
- [ ] 1.1 Report parsing and deploy read tests pass
- [ ] 1.2 Gates green (typecheck, lint, test)

### Phase 2: Deploy state on the project page

#### Automated
- [ ] 2.1 View test and `e2e/deploy.spec.ts` pass: version and passed deploy, failed deploy with earlier production, nothing without a workflow
- [ ] 2.2 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.3 Deploy section renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspects)
