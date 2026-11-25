---
change_id: otlp-endpoint-from-secret
title: "The OTLP endpoint reaches production whether it is stored as a variable or a secret"
status: planned
roadmap_item: null
branch: claude/project-thread-ipcwo2
created: 2026-11-25
updated: 2026-11-25
---

## Intent
Telemetry export works in production: the OTLP endpoint reaches the app, the worker and migrate whether the owner
stored `OTEL_EXPORTER_OTLP_ENDPOINT` as a repository variable or as a secret.

## Context
After the release v2026.11.25-2 (953ffdc) both containers log "observability: export disabled (no OTLP endpoint)".
The deploy job passes `OTEL_EXPORTER_OTLP_ENDPOINT` only through `app-vars` (repository variables); the owner set it,
most likely as a secret, so it never reaches `.env.prod`. `APP_LOCALE` already follows the same dual path: passed as
an optional secret, a variable of the same name wins over it.

## Constraints
- The endpoint stays optional: unset in both places, nothing is exported and the stack still starts.
- No change to the observability package or the compose file.

## Notes
- Research skipped: the cause is measured (container log) and the dual variable/secret pattern exists in the same
  workflow (`APP_LOCALE`).
- Frame skipped: the outcome is not in doubt.
