# Implementation review: telemetry-to-grafana-and-action-logs

Reviewed the diff against plan.md (autonomous mode, decisions taken).

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | With several forge tokens, a token of another owner answers 403/404 before the router moves on; logging each at warn would bury real failures. | Fixed: refusals and missing resources are debug in the client; the scan logs the outcome per project. |
| 2 | Warning | Once `GRAFANA_URL` is set, COCKPIT's own health reads `unknown: rules_not_applied` (a scan warning every period) until its rules are applied. | Accepted: the rules are applied right after the first release that exports (change Notes). |
| 3 | Suggestion | Traces from the bundled worker were not seen in the local check (no outgoing call in an empty scan). | Accepted: logs and metrics exported from the same bundle and SDK; fetch spans need no other setup. |
| 4 | Suggestion | Storage failures keep `errorLogLabel` instead of the error itself. | Kept on purpose: a database error's text can hold the values. |

Verdict: approve. Plan criteria met; no drift beyond the auto decisions in plan.md.
