# Plan: otlp-endpoint-from-secret

## Approach
Pass `OTEL_EXPORTER_OTLP_ENDPOINT` to the deploy action also as an optional secret (env line plus `secret-names`), the
way `APP_LOCALE` is passed. `app-vars` keeps carrying it as a variable and wins over a secret of the same name.

## Key decisions
- Accept both stores instead of asking the owner to move the value: the owner said it is set; our side adapts.

## Phase 1: The endpoint is read from a secret too

- Files: `.github/workflows/deploy.yml`, `tests/deploy/production-stack.test.ts`, `CHANGELOG.md`.
- Mode: TDD (the stack test expects the endpoint in `secret-names` and fails before the workflow change).
- Done when: the test fails before and passes after; gates green; PR CI green; after the owner-approved redeploy the
  containers no longer log "export disabled" and Grafana shows `cockpit` and `cockpit-worker` data.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: The endpoint is read from a secret too

#### Automated
- [x] 1.1 Stack test expects `OTEL_EXPORTER_OTLP_ENDPOINT` in `secret-names` (fails before the workflow change: 1 failed / 22 passed) — 1795ae7
- [x] 1.2 Deploy workflow passes the endpoint as an optional secret; CHANGELOG and README lines — 1795ae7
- [x] 1.3 Gates green: typecheck, lint (language scan), deploy stack tests 23/23, doctor — 1795ae7

#### After the release
- Export in production is verified after the owner-approved redeploy (container log, Grafana `cockpit` and
  `cockpit-worker` series) and reported to the coordinator; not a gate for this merge.
