# Plan review: assistant-reads-cockpit-over-mcp

Reviewed against change.md, research.md, the PRD (FR-13, G-5), the module README and the code on master 18683e6.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | TypeScript's `**` skips dot folders, so `app/.well-known/**` route files would escape the typecheck. | Fix: add `"app/.well-known/**/*.ts"` to `tsconfig.json` `include` (phase 2). |
| 2 | WARNING | The auth guard redirects every cookie-less request; the token endpoint, the OAuth token and registration routes and discovery would answer a redirect instead of `401` / JSON. | Fix: exclude them in `proxy.ts`, with a test of the guard's exclusions (phase 1 for `/api/mcp`, phase 2 for OAuth). |
| 3 | WARNING | The prune schedule needs its queue configured in `jobs()` and its handler in the worker, or the schedule enqueues jobs nobody runs. | Fix: spread `mcpAccessJobSchedules` and `mcpAccessJobHandlers`; the config test checks the queue is handled. |
| 4 | SUGGESTION | `get_project` with an unknown or malformed name must not throw a stack. | Applied: a tool error naming the input and how to list projects; tested. |
| 5 | SUGGESTION | `Overview.statusByKey` is a `Map` and serializes to `{}`. | Applied: the answer mapping picks fields explicitly; dates as ISO text. |
| 6 | SUGGESTION | The e2e should not depend on the order of scan results. | Applied: compare by entry id and project name, not position. |

Verdict: ready to implement after the fixes above (applied to the plan's file lists).
