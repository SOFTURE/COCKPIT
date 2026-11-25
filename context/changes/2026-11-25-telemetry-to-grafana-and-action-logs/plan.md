# Plan: telemetry-to-grafana-and-action-logs

## Approach
One service identity module (`src/observability/service.ts`: namespace `cockpit`, services `cockpit` and
`cockpit-worker`, environment from `APP_ENVIRONMENT`, version from `SOFTURE_RELEASE`) used by the web app, the worker
and migrate. Production passes `OTEL_EXPORTER_OTLP_ENDPOINT` (repository variable) and `OTEL_EXPORTER_OTLP_HEADERS`
(optional secret) to app, worker and migrate. Action logs are written with `createLogger(<area>)` at each use-case
boundary (the place that knows the outcome), with codes and identifiers only. Grafana rules and a dashboard live in
`ops/grafana/` in the house standard.

## Decisions (auto)
- Service names follow the owner's other projects (`cockpit`, `cockpit-worker`) instead of `cockpit-web`: nothing was
  exported under the old name yet.
- The endpoint is a variable, the Authorization header a secret, the names the package reads itself (no own names).
- MCP: every tool call logs tool, outcome and duration; `MCP_DIAGNOSTICS=1` keeps its meaning (protocol lines) but
  goes through the logger.
- Missing logger hooks in `@softure-ai/auth` and `@softure-ai/mailing` are filed in SOFTURE/AI, not worked around.
- The rules are applied after the first deploy that exports (otherwise "app silent" fires at once).

## Phase 1: Export from every process
- Files: `src/observability/service.ts`, `instrumentation.ts`, `scripts/worker.ts`, `scripts/migrate.ts`,
  `src/jobs/start-in-process-worker.ts`, `docker/prod/docker-compose.yml`, `.github/workflows/deploy.yml`,
  `scripts/deploy-dry-run.sh`, `tests/deploy/production-stack.test.ts`, `tests/observability/*`, README.
- Mode: test-after.
- Done when: the compose test holds the new names; the bundled worker (Dockerfile's esbuild command) exports a span,
  a log record and metrics to a local OTLP receiver; gates green.

## Phase 2: A structured line for every action
- Files: `src/forge/client.ts`, `src/forge/token-router.ts`, `src/scan/*`, `src/decisions/answer-entry.ts`,
  `src/broadcast/send-broadcast.ts`, `src/digest/*`, `src/mcp/*`, `app/(app)/**/actions.ts`, `src/team/*`,
  `modules/*` (console → logger), `src/projects/*`, `src/adapters/packages/npm-registry.ts`, tests.
- Mode: test-after (a capturing logger asserts the fields and that no secret or free text is logged).
- Done when: no bare `console.*` remains in app code outside the CLI; unit tests cover the forge, scan, answer,
  broadcast and digest lines; gates and e2e green.

## Phase 3: Grafana as code
- Files: `ops/grafana/rules.json`, `ops/grafana/dashboard.json`, `tests/observability/grafana-files.test.ts`.
- Mode: TDD (the test parses both files with the package's schemas and checks names, datasources, receiver).
- Done when: test green; the files parse with `parseGrafanaRulesFile`/the dashboard schema.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Export from every process

#### Automated
- [ ] 1.1 App, worker and migrate start observability with one service identity
- [ ] 1.2 Compose and deploy pass the OTLP endpoint (variable) and headers (secret) to app, worker and migrate
- [ ] 1.3 The bundled worker exports a span, a log record and metrics to a local OTLP receiver

### Phase 2: A structured line for every action

#### Automated
- [ ] 2.1 Forge reads that fail and the issue write log with code, status and repository, never the token
- [ ] 2.2 Scan, adapters, answers, broadcasts, digest, MCP tools, settings, team and "Scan now" log their outcome
- [ ] 2.3 No bare console call left in app code; tests prove fields and the absence of secrets and free text

### Phase 3: Grafana as code

#### Automated
- [ ] 3.1 Rules (app silent, worker silent, error series) and a dashboard parse with the package's schemas
- [ ] 3.2 Gates, unit tests and e2e green
