# Plan review: terminal-prints-cockpit-views

Reviewed against change.md, research.md, the PRD (FR-15, G-5), CMP-14's endpoint and tests, and the code on master 7aedbdb.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | An unreachable host can hang `fetch` for minutes instead of failing with a message. | Fix: `AbortSignal.timeout` (15 s) on the call; a timeout is `unreachable` and names the URL. Tested with a fetch that rejects. |
| 2 | WARNING | `process.exit()` right after writing can cut piped output (`cockpit overview --json \| jq`). | Fix: `bin.ts` sets `process.exitCode` and returns; nothing calls `process.exit`. |
| 3 | WARNING | A malformed `--url`/`COCKPIT_URL` would throw from `new URL` with a stack. | Fix: parsed into a usage error (exit 2) that names the value; tested. |
| 4 | SUGGESTION | The endpoint may answer SSE or plain JSON depending on the protocol version sent. | Applied: the client sends `2025-06-18` like the tests and reads either form. |
| 5 | SUGGESTION | A `--json` answer should be the tool's data, not the wrapped text, so scripts can use it. | Applied: the parsed answer, indented, after zod narrowing. |
| 6 | SUGGESTION | Moving the `describe*` helpers touches `src/overview` and `src/inbox`, which CMP-10/CMP-15 may also edit. | Accepted: a pure move with no change in behaviour; conflicts are resolved when master is merged in. |

Verdict: ready to implement after the fixes above (applied to phase 1).
