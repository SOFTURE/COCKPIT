# Research: telemetry-to-grafana-and-action-logs

## How it works today
- `instrumentation.ts` calls `registerObservability({ serviceName: "cockpit-web", serviceNamespace: "cockpit" })` and
  wires `onRequestError`. Export needs `OTEL_EXPORTER_OTLP_ENDPOINT` (+ `OTEL_EXPORTER_OTLP_HEADERS` for the
  credential); neither is in `docker/prod/docker-compose.yml` nor in `.github/workflows/deploy.yml`, so production
  exports nothing. No `environment`, no `serviceVersion`, no `traces.ignorePaths` (the container health check would
  produce a trace every few seconds).
- `scripts/worker.ts` runs `runJobWorkerProcess` without `startObservability` and without `logger`: the jobs module
  then logs to the console only. `@softure-ai/jobs` already logs the job lifecycle (`scheduled run enqueued`,
  `job run succeeded`, `job run failed`, `worker started/stopped`) through the logger it is given.
- `scripts/migrate.ts` starts nothing (one-shot: `lifetime: "short"` per the observability README).
- `src/jobs/start-in-process-worker.ts` (PGlite stacks) passes no logger either.
- Logging in the app's own code: about a dozen bare `console.error/warn` calls (modules' storage failures, team,
  repository suggestions, npm registry, a broadcast retry). Nothing logs a successful action: the forge write
  (`createIssue`), forge read failures, scans and their per-project outcomes, adapter outcomes, broadcasts, inbox
  answers (UI and MCP), the digest run, settings and team changes, "Scan now", MCP tool calls.
- `@softure-ai/auth` (sign-in, invitations) and `@softure-ai/mailing` (deliveries) take no logger; their failures
  surface only through the app's own results (an invitation send throws a `mailing.*` code, which auth logs itself).
  A logger hook is a gap of those packages (SOFTURE/AI), not something to work around here.
- `@softure-ai/mcp-access` accepts `diagnostics: (entry) => void` for one structured line per request.

## The owner's Grafana (read over the Grafana MCP, 2026-11-25)
- Datasources: `grafanacloud-prom` (metrics), `grafanacloud-logs` (Loki), `grafanacloud-traces` (Tempo).
- Existing projects (`service_namespace`: asystent, fire-tracker, reel-maker, trip-planner, vps-mcp, ...) follow one
  house standard: folder per project, group `<project>-health`, rules "app silent" (no `target_info` for 5 min,
  noData = Alerting), "worker silent", "error series" (more than 9 ERROR/FATAL records in 15 min, for 10m), exec
  error = OK, receiver `<PROJECT> · mail`; app `service_name` = project name, worker `<project>-worker`.
- No `cockpit` namespace yet; no `COCKPIT · mail` contact point.
- COCKPIT watches itself; its observability adapter reads `ops/grafana/rules.json` of every watched repository, so a
  rules file here gives COCKPIT its own health row once the rules are applied.

## Risks
- The worker is bundled by esbuild (Dockerfile): the OpenTelemetry SDK must load and export from the bundle. Verify
  with the same esbuild command against a local OTLP receiver.
- Series budget (Grafana Cloud Free): app + worker, runtime metrics, about 300 series; migrate runs `lifetime: short`.
- Personal data: forge paths carry repository names only; never log mail addresses, note text, broadcast text,
  tokens or URLs with queries.
