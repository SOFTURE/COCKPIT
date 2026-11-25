# Research: wake-projects-by-firing-routines

## How it works today
- **Wake adapter (CV-2):** `src/adapters/wake/*` reads each project's `context/workflow.json` →
  `autonomy.cockpitWake` (falling back to `autonomy.ownerWordWake`) during the scan (`src/jobs/handlers.ts` registers
  `createWakeAdapter()`), stores it in `adapters.reads`, and shows it as a chip on the overview
  (`src/overview/build-overview.ts`, `overview-row.tsx`), on the broadcast detail page (`build-broadcast-view.ts`,
  `app/(app)/broadcast/[id]/page.tsx`) and as a card on the project page's Waiting tab (`WakeDetails`). COCKPIT never
  wakes anything itself: the project's own GitHub-triggered routine reacts to the label.
- **Labels and markers:** `src/forge/issue-label.ts` prefers `cockpit` and falls back to `owner-word`
  (`findIssueLabel`); `ForgeClient.listOwnerWordIssues` lists both labels (`src/forge/client.ts`, routed per token in
  `src/forge/token-router.ts`); `src/inbox/owner-word-marker.ts` parses `<!-- cockpit: … -->` and
  `<!-- owner-word: … -->` and writes the one the label picks. Users: `src/forge/issues.ts` (answer, broadcast and
  promotion issues), `src/decisions/answer-entry.ts`, `src/broadcast/send-broadcast.ts`,
  `src/roadmap/promote-roadmap.ts`, `src/roadmap/load-roadmap-view.ts`, `src/scan/scan-projects.ts`,
  `src/inbox/build-inbox.ts`, `src/mcp/answer-tool.ts`, `cli/answer-schemas.ts`, `app/(app)/inbox/answer/actions.ts`.
- **Issue creation points:** `answerEntry` (inbox, MCP `answer_entry`, CLI through the MCP server), `sendBroadcast` /
  `retryBroadcastSend`, `promoteRoadmap` (no database handle; called from
  `app/(app)/projects/[owner]/[name]/roadmaps/[slug]/actions.ts`).
- **Storage:** module `projects` (`modules/projects/*`, migrations 0001–0006; drizzle schema in `schema.ts`).
  Migrations are checksummed by `@softure-ai/db` (`computeChecksum` hashes the whole file, comments included), so
  the applied 0002, 0003 and 0005 cannot be edited even where their comments say "owner-word".
- **Jobs:** `@softure-ai/jobs` with schedules in `softure.config.ts` (`every: "<n>m"`), handlers in
  `src/jobs/handlers.ts`; the e2e runs jobs in the app process (`JOBS_IN_APP_PROCESS`).
- **Logging:** `createLogger` from `@softure-ai/observability` (structured fields; #94 ships them to Grafana).
- **Project page:** tabs from `src/project-page/project-tabs.ts` (Waiting, Roadmaps, Changes, Production).
- **e2e:** `e2e/fake-forge.ts` is one HTTP server for the forge, Grafana (`/grafana`) and npm (`/npm`); the app reads
  each base URL from the environment (`playwright.config.ts` `SERVER_ENV`).

## SOFTURE modules
- No `@softure-ai/*` package encrypts a secret at rest (`security`, `core`, `mailing` checked; `mailing` only keys
  email addresses with HMAC). Encryption is a small local helper on `node:crypto` (AES-256-GCM, key derived with
  HKDF from a new secret) and the gap is filed in SOFTURE/AI so it can move into a package.
- Rate limiting: `@softure-ai/security` buckets limit inbound requests per client; nothing limits outbound calls per
  key. The fire limits are a count over COCKPIT's own fire log.

## Production
- `docker/prod/docker-compose.yml` puts app and worker on the `edge` and the project's default network, neither
  `internal`, so outbound HTTPS (already used for GitHub, Grafana and npm) reaches api.anthropic.com. A read-only check
  from the server confirms it before the report (see plan Phase 5).
- A new secret `ROUTINE_TOKEN_SECRET` keys the token encryption. It is optional in compose (`:-`): without it the
  routines tab says so and stores nothing, so a deploy never stops at the secret check; the owner sets it once.

## Risks
- A token in a log or an error: every log line names the routine id and trigger id only; the API's error body is
  reduced to its `error.type` word; tests capture the logs and the stored reason.
- Fires racing the limits: the limit check and the log insert run in one transaction under an advisory lock.
- Retrying a fire must never fire twice for one issue and routine: one fire row per issue and routine, claimed before
  the call (as broadcast sends).

## Decisions (auto)
- Promotion issues are cockpit issues too, so they fire as well; their fires show on the project's Routines tab.
- "100 per account" → 100 fires per hour across every routine of this COCKPIT instance (COCKPIT cannot tell which
  Anthropic account a token belongs to).
- A 429 is queued (status 429 shown, "rate limited") and retried after its `retry-after` by a one-minute schedule, at
  most 5 attempts; other failures stay failed until Retry.
- A "Test" fire counts toward the limits and sets the routine's last fire result.
- The grep cannot be empty in history: applied migrations (checksummed), `context/` archives, released CHANGELOG
  entries, and the managed SOFTURE block of `AGENTS.md` plus `.claude/` (installed by `@softure-ai/skills`; the owner's
  rule: skills are not touched). The check used is
  `git grep -i "owner-word\|ownerword\|cockpitWake\|cockpit-wake" -- . ':!context' ':!.claude' ':!AGENTS.md' ':!CHANGELOG.md' ':!modules/projects/migrations'`,
  plus the project-specific part of `AGENTS.md` (outside the managed block) and the new CHANGELOG entry.
