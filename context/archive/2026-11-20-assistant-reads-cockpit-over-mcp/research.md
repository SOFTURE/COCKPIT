# Research: assistant-reads-cockpit-over-mcp

Date: 2026-11-23 · Base: master 18683e6 · Module: `@softure-ai/mcp-access` 0.7.8 (README read in full)

## How it works today
- No MCP. The screens read through `src/inbox/load-inbox.ts` (`loadInbox`) and `src/overview/load-overview.ts`
  (`loadOverview(inbox)`); both read the watched projects, the stored scan reads, the answers and the forge facts
  from the database and build plain values with `buildInbox` / `buildOverview`. The overview takes the inbox so both
  count unanswered entries the same way.
- A project's page (`app/(app)/projects/[owner]/[name]/page.tsx`) is still a placeholder showing the repository's
  access; CMP-9 (in parallel) fills it in. The project's detail today is its overview row plus its inbox entries.
- `proxy.ts` sends every request without a session cookie to the login page, except `/api/health`.
- Settings has an account section (change password, sign out).
- Data is not per account: one owner (teams come in CMP-19); every query returns all watched projects.

## What the module gives
- `mcpAccess({ serverName, tools, allowWrites, oauth })` in `softure.config.ts`; tables in schema `mcp` (its own
  migrations, run by `npm run migrate` and the tests' module template; no app migration, so no collision with
  CMP-12's migration).
- `createMcpRoute({ createServer })` for `POST /api/mcp`: Bearer token → fresh server from the factory; unknown,
  revoked, expired tokens get the same `401 invalid_token` before the factory runs.
- `createMcpServerFactory` (`/server`): version follows the tool list; `strictToolInput`; `serverInfoTool`.
- `withToolErrors`, `toolResult`, `createUntrustedWrapper` for answers holding text the app did not write.
- `McpAccessPage` at `/account/mcp` (token issue, setup snippets, revoke), OAuth 2.1 routes and consent page
  (`oauth.enabled`), `buildOAuthConsentHeaders()` for `next.config`.
- `/testing`: `expectToolCatalogMatchesServer`, `measureServedToolLists`.
- `/jobs`: `mcpAccessJobSchedules`, `mcpAccessJobHandlers` (daily prune).
- `MCP_RATE_LIMIT_BUCKETS` for security.

## Risks
- Entry texts, titles and roadmap names come from watched repositories (written by agents): they are data, never
  instructions to the assistant → wrap answers with the untrusted markers.
- The auth guard must not redirect `/api/mcp`, `/api/oauth/token`, `/api/oauth/register` or `/.well-known/*`.
- `loadInbox`/`loadOverview` call `connection()` (request scope); a tool call runs inside the route's request, so
  they work there; unit tests inject a reader instead.
- Writes: none in this item; `allowWrites: false` keeps every token read-only, so no answer tool is listed (FR-13).

## Unknowns answered
- OAuth client registration: open (default). A registered client grants nothing until the signed-in owner consents;
  the route is rate-limited (`mcp-oauth`). Closed registration would need an ops script on the server each time the
  owner adds a connector.
