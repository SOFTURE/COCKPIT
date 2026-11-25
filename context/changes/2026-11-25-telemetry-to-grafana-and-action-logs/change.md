---
change_id: telemetry-to-grafana-and-action-logs
title: "COCKPIT sends its logs, traces and metrics to Grafana, and every action it takes leaves a structured log line"
status: open
roadmap_item: null
branch: claude/project-thread-ipcwo2
created: 2026-11-25
updated: 2026-11-25
---

## Intent
The owner (and an assistant reading Grafana) can see what COCKPIT does in production: the web app and the worker
export logs, traces and metrics over OTLP to Grafana once the operator sets the endpoint and its credentials, and
every action (forge reads and the issue write, scans, broadcasts, inbox answers, the digest mail, MCP tool calls,
settings and team changes, worker jobs, migrations) writes a structured info line on success and a warn or error
line on failure. COCKPIT keeps its own Grafana alert rules and dashboard as code, so its own health shows on its
project page like any other watched project.

## Context
- `@softure-ai/observability` 0.8.8 is already a dependency; `instrumentation.ts` registers it for the web app, but
  no endpoint reaches the containers, the worker never starts it, and almost every module logs with bare `console.*`
  or not at all.
- The owner's Grafana Cloud stack already holds the other projects' rules (folder per project, rules "app silent",
  "worker silent", "error series", contact point "<PROJECT> · mail"); COCKPIT has none and sends nothing yet.

## Constraints
- No skills changes, no release, tag, publish or deploy (owner's word).
- Nothing names a real person, host or token in the repository; endpoint and credentials are runtime configuration.
- Logs never carry tokens, mail addresses, note or broadcast text, or request bodies.

## Notes
- Frame skipped: the owner asked for exactly this and the package that does it is already installed.
