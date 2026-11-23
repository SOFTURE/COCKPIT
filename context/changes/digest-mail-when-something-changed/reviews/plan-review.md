# Plan review: digest-mail-when-something-changed

Reviewed `plan.md` against `change.md`, `research.md`, the PRD (FR-12) and the code on master 18683e6. Mode: `--auto`.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | A retry after an outage re-computes the digest from newer reads; recipients already mailed would get a second, different mail. | Fixed in the plan: the pending row stores the rendered mail and is always sent before a new comparison. |
| 2 | WARNING | Two digest runs at once (a manual run beside the schedule, two workers) could insert two pending rows. | Fixed: a partial unique index allows one `pending` row; the queue runs with concurrency 1. |
| 3 | WARNING | Entry texts and outcomes come from watched repositories and go into an HTML body. | Fixed: the render test asserts HTML escaping; the subject carries counts only, never repository text. |
| 4 | WARNING | The unsubscribe page and route sit behind the auth guard (`protect: ["/"]`), so a mail client's one-click POST would be redirected to the login page. | Fixed: `proxy.ts` excludes both paths; `e2e/unsubscribe.spec.ts` proves it. |
| 5 | SUGGESTION | The digest reads while a scan may be writing; a project read mid-scan is either the old or the new row. | Accept risk: each project row is written atomically, and the next digest reports whatever this one missed. |
| 6 | SUGGESTION | `compose.yaml` should name the new variables. | Skipped: lane R owns it; CMP-13 (digest release ready) names them; owner steps record them here. |
| 7 | SUGGESTION | Settings could show whether the digest is configured. | Skipped: not in the outcome; adds UI outside the item. |

Verdict: ready to implement after fixes 1-4 (applied to `plan.md`).
