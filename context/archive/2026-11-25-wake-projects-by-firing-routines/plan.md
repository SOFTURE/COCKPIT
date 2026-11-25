# Plan: wake-projects-by-firing-routines

## Approach
Delete the wake adapter and every path of the older label first, so the rest is built on one label (`cockpit`) and one
marker. Then add routines as COCKPIT's own data (one migration in module `projects`), a routines API client with an
injectable base URL, a `wakeProject` service called right after each issue is created, the UI (project page
"Routines" tab, fire status with Retry on the broadcast page and the inbox), and the overview chip from that data.

## Key decisions
- Tables (migration `0007_create_routines.sql`): `routines` (id, repository_key, name, kind, trigger_id,
  token_ciphertext, token_last4, enabled, last_fire_ok, last_fire_status, last_fire_at, created/updated),
  `routine_fires` (one row per issue and routine, or one `no_routine` row per issue: status
  `sending | sent | failed | queued | no_routine`, http_status, reason, attempts, next_attempt_at), and `fire_log`
  (routine_id, fired_at) for the hourly limits.
- Token encryption: AES-256-GCM, key = HKDF-SHA256(`ROUTINE_TOKEN_SECRET`, info `cockpit.routine-token.v1`),
  stored as `v1.<iv>.<tag>.<ciphertext>` (base64url). The token never leaves the server: loaders return `last4` only.
- Routines API client `src/routines/routines-api.ts`: base URL `ROUTINES_API_URL` (default
  `https://api.anthropic.com`), 10 s timeout, result `{ ok, status }` or `{ ok: false, status, reason, retryAfterSeconds }`
  where `reason` is one of `rate_limited | unauthorized | forbidden | not_found | rejected | server_error |
  unreachable | timeout`, never text from the token or the body beyond the API's `error.type` word.
- Wake service `src/routines/wake-project.ts`: `wakeIssue({ db, clock, api, secret, repositoryKey, fullName, issue })`
  claims a fire row per enabled `cockpit-issues` routine (unique index), checks the limits in one transaction with
  `pg_advisory_xact_lock`, fires, records. `retryIssueWake` re-runs it for failed, queued and stale rows and for an
  issue that had no routine. `drainQueuedFires` (schedule `cockpit.routine-fires`, every 1 m) fires due queued rows.
- Callers: `answerEntry` (after `markAnswerSent`), `sendToProjectOnce` (after `recordSent`), the promote action
  (after a new promotion). A wake failure is logged and recorded, never returned as the caller's failure.

## Phases

### Phase 1: one label, one marker, no wake adapter (test-after)
- Remove `src/adapters/wake/**`, its handler registration, chips, copy, tests, e2e `wake.spec.ts` and fake-forge
  workflow fixtures used only by it.
- the old marker module (now `src/inbox/answer-marker.ts`) → `src/inbox/answer-marker.ts` (`ANSWERS`, `parseAnswerMarker`,
  `formatAnswerMarker`, only `cockpit`); `issue-label.ts` → only `ISSUE_LABEL = "cockpit"`, `hasIssueLabel`;
  `listOwnerWordIssues` → `listCockpitIssues` (one label); issue texts and titles say "cockpit issue"
  (title prefix `COCKPIT:`).
- Done when: typecheck, lint, unit tests green; the scoped grep is empty.

### Phase 2: routines stored, encrypted, managed (TDD)
- Migration 0007, schema, `modules/projects/routines.ts` (CRUD, fires, log), `src/routines/token-box.ts`,
  `src/routines/trigger-id.ts` (id or fire URL), project page tab "Routines" with add / replace token / enable /
  disable / delete / Test, server actions.
- Done when: unit tests for encryption (round trip, wrong key, tamper), trigger-id parsing, CRUD; the page renders
  without the token.

### Phase 3: fire after every cockpit issue, limits, Retry (TDD)
- `routines-api.ts`, `wake-project.ts`, `fire-limits.ts`, wiring into the three callers, the drain schedule.
- Fire status per issue on the broadcast detail page and on an answered inbox row, Retry per issue; the Routines tab
  lists the project's recent fires with Retry.
- Done when: unit tests for request shape (URL, headers, body text), redaction (no token in logs or stored reason),
  429 queued and drained, limits 30/100, many routines per project, no-routine record, failure keeps the issue.

### Phase 4: overview from own data, MCP, CLI, README (test-after)
- Overview chip `wakes on its own | failing | not tested | none` from routines; MCP and CLI outputs unchanged apart
  from the renamed answer enum, and checked to carry no token.
- README "Waking a project"; CHANGELOG; compose `ROUTINE_TOKEN_SECRET` and `ROUTINES_API_URL` (optional).

### Phase 5: e2e and integration
- Fake routines API in `e2e/fake-forge.ts` (`/anthropic/v1/claude_code/routines/<id>/fire`, `/__fires`, a trigger
  that fails once); `e2e/routines.spec.ts`: configure a routine, Test, broadcast to two projects, one fire each, a
  failing routine recovered by Retry; existing specs updated for the label and texts.
- Full integration: `npm run build && npm run e2e`.
- Production egress checked read-only from the server (VPS MCP `exec_read`: an HTTPS request to api.anthropic.com).

## Progress
- [x] Phase 1: one label, one marker, no wake adapter — `git grep -i` for the older label empty outside the three applied migrations and the skills-installed files; unit tests 679 passed
- [x] Phase 2: routines stored, encrypted, managed — migration 0007, `tests/routines/token-box.test.ts`, `manage-routines.test.ts`
- [x] Phase 3: fire after every cockpit issue, limits, Retry — `tests/routines/wake-issue.test.ts`, `routines-api.test.ts` (request shape, 429, limits 30/100, no token in logs or rows)
- [x] Phase 4: overview from own data, MCP, CLI, README — `tests/overview/build-overview.test.ts`; MCP answers wake through `answerEntry`; the CLI shows no routine data; README "Waking a project"
- [x] Phase 5: e2e and integration — `npx playwright test`: 75 passed incl. `e2e/routines.spec.ts`; master merged (bbaf71c), 683 unit tests passed
