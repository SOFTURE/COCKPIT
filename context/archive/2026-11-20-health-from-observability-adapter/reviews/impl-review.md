# Implementation review: health-from-observability-adapter

Scope: full · Date: 2026-11-23 · Commits: faaa796, ec24d3b, the review fix below · Gates: typecheck ✓, lint ✓
(ESLint + language), test ✓ (165); integration: build ✓, e2e ✓ (20, on the tree of ec24d3b)

## Verdict
Ready. `src/adapters/contract.ts` defines the optional adapter (`value | absent | unknown | rate_limited`); the
observability adapter reads the project's `ops/grafana/rules.json` through the forge and the states of those rules
from Grafana (`GRAFANA_URL`, `GRAFANA_TOKEN`), filtered by folder and rule uids on COCKPIT's side. The scan stores
every adapter result in `adapters.reads` (module `adapters`, migration adapters/0001). The overview row and the
project page show Healthy, "Unhealthy: N alerts firing" (titles in the hint) or "Health unknown" with the reason; an
unhealthy project is broken (`unhealthy`); a project without a rules file, or a COCKPIT without a backend, shows
nothing extra.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | 1 |
| Scope | PASS | no deploy state (CMP-22); compose and deploy files untouched (CMP-23) |
| Progress honesty | PASS | 2.4 settled by eight screenshots the run inspected (overview and project page, 1280 and 390 px, light and dark) |
| Correctness | PASS | 1 (fixed) |
| Tests | PASS | 1 |
| Data and migrations | PASS | new schema with checks on status/value/reason; cascade with the repository; rollback in the header |
| Security | PASS | the token only in the Authorization header; failures carry codes (tested); read only toward repositories |
| Architecture and patterns | PASS | module and reads mirror `overview`; HTTP through `requestJson`; rules parsed by `@softure-ai/observability` |
| Lessons | PASS | none applies |

## Findings
| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | WARNING | An unreachable Grafana costs one request timeout (10 s) per project; 30 projects would pass NFR-2's 2 minutes. | Fixed: one adapter per scan run stops calling the backend after the first unreachable answer and reports `backend_unavailable` at once (test: one call for two projects). |
| 2 | SUGGESTION | Progress item 2.2 names `e2e/overview.spec.ts`; the assertions live in `e2e/health.spec.ts` (own fictional projects, shared database). | Accept: the item's wording stays (never renamed); the evidence is `e2e/health.spec.ts`. |
| 3 | WARNING | Tests were written beside the code, so none was seen red first. | Checked by mutation: dropping the folder filter fails 1 of 20 adapter tests; dropping `isUnhealthy` fails 1 of 13 overview tests; restored, green. |

## Evidence
- `cockpit/evidence/health-from-observability-adapter/01-overview-health-after-{1280,390}-{light,dark}.webp` and
  `02-project-page-health-after-{1280,390}-{light,dark}.webp` (project files).

## After merging CMP-12

- The digest (CMP-12) builds its snapshot with the overview builder, so it now also reads the adapters' stored
  results: a project broken by its health is "broken" in the mail too (`unhealthy` added to the snapshot's reasons
  and to the digest copy). Test: `tests/digest/build-snapshot.test.ts` ("counts a project whose observability
  reports alerts firing as broken"). Gates after the merge: typecheck, lint, 211 unit tests, build, e2e 26/26.
