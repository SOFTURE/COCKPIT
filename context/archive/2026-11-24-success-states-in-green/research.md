# Research: success-states-in-green

## Where the colours come from
`Badge variant="tag" color=…` and `Status color=…` from `@softure-ai/theme-notion`; every colour is picked at the call
site in COCKPIT. No shared package decides "success" — fixing it here is the right route.

## Grey success states found (sweep of every `color=` in `src/` and `app/`)
| Place | State | Today | Should be |
| --- | --- | --- | --- |
| `src/adapters/packages/packages-details.tsx` | package current | gray | green |
| `src/overview/overview-row.tsx` RunChip | CI / quality review passed | gray | green (running blue) |
| `src/overview/overview-row.tsx` DoctorChip | doctor OK | gray | green (pending blue) |
| `src/adapters/observability/health-chip.tsx` | healthy | gray | green |
| `src/adapters/deploy/deploys-list.tsx` | last deploy passed | gray | green (running blue) |
| `src/adapters/deploy/deploys-list.tsx` | production version known | blue | green (as on the project page card) |
| `src/status/status-look.ts` + `project-status-badge.tsx` | idle (moon) | gray | blue (owner's word) |

Already right: read status, repository access, roadmap pills (done green), history runs, deploy step badges, inbox
answer states, broadcast send status, wake chip.

## Tests touching it
`e2e/overview.spec.ts`, `e2e/health.spec.ts`, `e2e/deploys.spec.ts`, `e2e/packages.spec.ts` select by `data-*` and
text, not colour; `tests/adapters/deploy-step-looks.test.ts` pins deploy step colours.
