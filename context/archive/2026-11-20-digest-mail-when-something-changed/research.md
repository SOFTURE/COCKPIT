# Research: digest-mail-when-something-changed

## Question
How CMP-12 sends the owner one digest mail on a schedule listing what shipped, what waits for them and what broke
since the last digest, sends nothing when nothing changed, and offers one-click unsubscribe (FR-12, G-5).

## Today (master 18683e6)
- No mail anywhere: `@softure-ai/mailing` is not a dependency; `softure.config.ts` has security, auth, ops,
  `projects`, `overview` and `jobs` (one queue, the scan, every `SCAN_INTERVAL_MINUTES`).
- The scan (`src/scan/scan-projects.ts`) stores per project the last good `context/state.json` and the cockpit
  issues (`projects.reads`) and the forge facts (`overview.forge_facts`). It writes no history: each read replaces
  the previous one, so "since the last digest" needs a stored snapshot of its own.
- The two screens are pure builders over those rows: `buildInbox` (`src/inbox/build-inbox.ts`, open entries with
  their answer state from `projects.answers` and cockpit issues) and `buildOverview`
  (`src/overview/build-overview.ts`, the status rule of FR-8 with broken reasons). Their loaders are `server-only`
  and call `connection()`, so a job reads the same rows itself and calls the same builders.
- Jobs: `src/jobs/handlers.ts` maps queues to handlers; `scripts/worker.ts` and the in-app worker
  (`JOBS_IN_APP_PROCESS`) run them. A handler gets `{ db, clock, config }`. Schedules take `every` or `at`
  (local `HH:MM` in the config's `timezone`).
- `proxy.ts` guards every path but `/api/health`; the unsubscribe page and route must stay public.
- Tests: `tests/support/test-context.ts` gives a migrated PGlite per test with the app config;
  `@softure-ai/jobs/testing` runs due jobs.

## What each section means, from the stored data
- **Shipped:** an active-roadmap item whose `status` starts with `done` (`done`, `done_code …`) that was not done in
  the previous snapshot; a release version (forge release first, the state's `last_release` as the overview shows
  it) that differs from the previous one.
- **Waits for you:** an inbox row whose answer is still `open` and whose entry id was not open in the previous
  snapshot (a new entry, or one reopened because its text changed).
- **Broke:** a project whose overview status is `broken` now and was not broken in the previous snapshot; its broken
  reasons name why.
- A project absent from the previous snapshot (added since) contributes no lines: its current state becomes its
  baseline, so adding a repository never mails its whole history.
- The first digest run has no previous snapshot: it records the baseline and sends nothing.

## `@softure-ai/mailing` 0.2.8 (installed, README read)
- `mailing({ from, provider })`; `resend()` reads `RESEND_API_KEY` on every send, so the config loads without the
  secret. `from` is checked at config load.
- List mail (`kind` other than `transactional`) gets a signed one-click unsubscribe footer, `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers (RFC 8058), and is refused (`mailing.suppressed`) for an unsubscribed recipient.
  Needs `MAILING_UNSUBSCRIBE_SECRET` (at least 32 characters) at send time.
- `deliverOnce(ctx, { scope, mail })` sends at most once per scope and recipient (ledger `mailing.deliveries`) and
  answers `sent`, `rejected`, `done`, `in-flight`, `uncertain`, `retry-later` or `halted`.
- The page `/unsubscribe` and the route `/api/mailing/unsubscribe` mount with one line each; module migrations in
  schema `mailing`.
- `fakeMailProvider()` (`/testing`) keeps sent mail in memory for tests.
- Peers: next, react, drizzle-orm, `@softure-ai/ui`, `@softure-ai/jobs`: all present.

## Unknown from the roadmap: digest time and recipients (owner; blocks: no)
Decided (runtime configuration, AGENTS.md: notification recipients are never committed): `DIGEST_RECIPIENTS`
(comma-separated addresses) and `DIGEST_AT` (`HH:MM` in `APP_TIMEZONE`, default `08:00`, daily). Without
recipients or `MAIL_FROM` the digest job ends as "not configured" and sends nothing, so the app runs without mail.

## Collisions
- Lane C: CMP-14 (MCP) runs in parallel and also edits `softure.config.ts` and adds a migration. COCKPIT's migrations
  live per module (`modules/<id>/migrations/`, numbered per module), so a new `digest` module with its own
  `0001` cannot collide with another module's number. `softure.config.ts`, `src/jobs/handlers.ts`, `package.json`,
  `package-lock.json`, `messages/en.ts`, `proxy.ts` and `README.md` may conflict textually: resolved by keeping both
  sides at the merge.
- Lane R owns `compose.yaml` / `docker/**`: the new variables are named in CMP-13 (digest release ready), not here;
  they go to `## Before the next release` as owner steps.

## Framing
Skipped `softure-frame`: the outcome is user-visible (a mail), the PRD row names the module, and research found no
cheaper path or contradicted baseline.
