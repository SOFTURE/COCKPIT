# Plan review: telemetry-to-grafana-and-action-logs

Reviewed against change.md, research.md and the code (autonomous mode, decisions taken).

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | The worker bundle may not export (OpenTelemetry under esbuild). | Accepted: 1.3 proves it with the Dockerfile's own esbuild command against a local receiver. |
| 2 | Warning | `/api/health` checks would flood traces. | Accepted: `traces.ignorePaths: ["/api/health"]` in the web app. |
| 3 | Warning | Logging free text (notes, broadcast bodies, mail addresses) would put personal data in Loki. | Accepted: 2.3 asserts the logged fields carry codes and identifiers only. |
| 4 | Suggestion | Applying rules before the first export fires "app silent". | Accepted: rules applied after the deploy (Decisions). |
| 5 | Suggestion | `migrate` adds new series per run. | Accepted: `lifetime: "short"`. |

Verdict: ready to implement.
