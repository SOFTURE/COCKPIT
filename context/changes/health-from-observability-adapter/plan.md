# Plan: health-from-observability-adapter

## Goal
An optional adapter reads each watched project's health from its observability backend (the state of its Grafana
alert rules): the overview row and the project page show it, an unhealthy project is broken, a failing source shows
unknown with its reason, and projects without a source show nothing extra. Out of scope: deploy state (CMP-22),
production wiring of the variables (CMP-23).

## Approach
**Starting point:** no adapters; the scan stores state, issues and forge facts; the status rule has three broken
reasons.

**Chosen:** `src/adapters/contract.ts` defines a project adapter (`id`, `read(project)` → `value | absent | unknown |
rate_limited`). `src/adapters/observability/` reads the project's `ops/grafana/rules.json` through the forge, asks
Grafana for rule states and returns `healthy` or `unhealthy` with the firing rules. The scan runs the adapters it is
given after the forge facts and stores each result in `adapters.reads` (new module `adapters`). The overview turns a
stored health into a row field, a chip and the broken reason `unhealthy`; the project page shows the same value.
Rejected: error-rate queries (per-project PromQL COCKPIT cannot know); storing in `overview.forge_facts` (migration
collisions with parallel threads, and CMP-22 needs the same shape).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Signal | any of the project's alert rules firing | the rules are the project's own definition of unhealthy | research |
| Source of rules | `ops/grafana/rules.json` on the main branch | observability README convention; Contents: read only | research |
| Backend | `GRAFANA_URL`, `GRAFANA_TOKEN`; unset = adapter off | same names as the apply command | research |
| Storage | module `adapters`, table `reads`, migration `adapters/0001` | no collision; CMP-22 reuses | research |
| Failure | `unknown` with a reason code replaces the value | PRD FR-17 | prd |
| Status | broken reason `unhealthy`; unknown never breaks | FR-17, FR-8 | prd |

## Phase 1: Adapter contract, observability adapter, storage and scan
**Discipline:** TDD (business rule). **Files:** `src/adapters/contract.ts`, `src/adapters/observability/**`
(`read-health.ts`, `grafana-client.ts`, `observability-adapter.ts`), `modules/adapters/**` (module, schema,
`reads.ts`, `health.ts`, migration `0001_create_reads.sql`), `softure.config.ts` (register the module),
`src/scan/scan-projects.ts` (run adapters), `src/scan/scan-handler.ts`, `src/jobs/handlers.ts`, tests.

**Tests:** `tests/adapters/read-health.test.ts` (no Grafana configured → absent without calls; no rules file →
absent; invalid file → unknown `rules_invalid`; file refused → unknown `rules_unreadable`; forge rate limit →
rate_limited; Grafana 401/403 → unknown `backend_refused`; 5xx → `backend_unavailable`; bad JSON →
`backend_invalid_answer`; firing rule of the folder → unhealthy with titles; pending/inactive → healthy; rules of
another folder ignored; none of the project's rules in Grafana → unknown `rules_not_applied`), `tests/adapters/
reads.test.ts` (upsert, unknown replaces the value, rows leave with their repository), scan test (adapter result
stored; adapter rate limit stops the scan).

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Health in the overview, the status and the project page
**Discipline:** TDD for the status and the overview row, test-after for the UI. **Files:**
`src/status/project-status.ts`, `src/overview/build-overview.ts`, `src/overview/load-overview.ts`,
`src/overview/overview-row.tsx`, `src/adapters/observability/health-chip.tsx`, project page, `messages/en.ts`
(`health.*`, `overview.brokenReasons.unhealthy`), `e2e/fake-forge.ts` (rules files and a fake Grafana),
`playwright.config.ts` (env), `e2e/overview.spec.ts`, `.env.example`, `README.md`.

**Tests:** status test (`unhealthy` broken, unknown not), overview test (row health from stored reads: none, healthy,
unhealthy, unknown); e2e: a fixture project whose fake Grafana fires an alert is broken with "Unhealthy" in the
overview and on its page; a healthy one shows "Healthy"; one whose source fails shows "Health unknown"; projects
without a rules file show no health chip.

**Done when:**
- Automated: the tests and the e2e pass; Gates green.
- Manual: the chips render on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the
  run inspects, saved to the project files).

## Risks and rollback
- Rollback: revert the merge; `DROP SCHEMA adapters CASCADE;` and delete the `softure.migrations` rows of module
  `adapters` (see the migration header).

## Decisions (auto)
- Health = the state of the project's own Grafana alert rules, found through its `ops/grafana/rules.json`.
- A module `adapters` with a generic `reads` table instead of columns on `overview.forge_facts`.
- The compose and deploy files (lane R) stay untouched; CMP-23 passes `GRAFANA_URL` and `GRAFANA_TOKEN`.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Adapter contract, observability adapter, storage and scan

#### Automated
- [ ] 1.1 Adapter tests pass: absent, unknown reasons, rate limit, healthy, unhealthy, folder filter
- [ ] 1.2 Reads and scan tests pass with the adapter
- [ ] 1.3 Gates green (typecheck, lint, test)

### Phase 2: Health in the overview, the status and the project page

#### Automated
- [ ] 2.1 Status and overview tests pass with health
- [ ] 2.2 `e2e/overview.spec.ts` passes: unhealthy is broken, healthy, unknown, nothing for projects without a source
- [ ] 2.3 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.4 Health chips render on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspects)
