# Research: mcp-release-ready

Read on master 73fae50 (CMP-1 to CMP-9, CMP-12 to CMP-15 and CMP-21 merged), with `@softure-ai/deploy` 0.7.8 and
`@softure-ai/mcp-access` as installed.

## How things are today
- CMP-14 added MCP over a token or OAuth (`app/api/mcp/route.ts`, `app/api/oauth/**`, `app/.well-known/**`); CMP-15
  turned writes on. Two settings are read from the environment, both by the app only:
  - `MCP_ALLOW_WRITES` (`softure.config.ts` → `isMcpWritingAllowed`): writes stay on unless it is `0`; an answer still
    needs a write token or a grant with write access.
  - `MCP_DIAGNOSTICS` (`app/api/mcp/route.ts`): `1` logs one line per request.
- Neither name is in `docker/prod/docker-compose.yml`, so production can never turn writes off or diagnostics on: the
  compose file passes only the names it lists (the note from CMP-13 and the roadmap's run state).
- The MCP routes need no secret of their own: tokens and grants live in the database; the OAuth issuer is
  `APP_ORIGIN`, which production already sets from `APP_HOST`.
- The worker runs the token and grant pruning schedules (`mcpAccessJobSchedules`); it reads neither setting.
- `tests/deploy/production-stack.test.ts` pins the required names and the digest's optional ones per service;
  `scripts/deploy-dry-run.sh` checks the health routes and the digest settings inside the running stack.
- `package.json` is `0.2.0`; `CHANGELOG.md` has `0.2.0 (unreleased)` (digest) and `0.1.0 (unreleased)`. Nothing is
  tagged.

## What the packages give
- `env render`: `${NAME:-}` is optional, written when set and left out otherwise; `app-vars: toJSON(vars)` passes
  repository and environment variables by name (deploy README).
- The production request path: the security module refuses a request without a proven client address
  (`unidentified: "refuse"`), so a probe inside the container sends the edge proof and a client-IP header as the router
  does.

## Framing
`frame` skipped: the outcome is the packaging step the roadmap fixes (version, notes, the MCP settings, dry run); no
competing framing.

## Risks
- Parallel release items (CMP-11, CMP-20, CMP-23) also touch the compose file, `deploy.yml`, `package.json` and
  `CHANGELOG.md`: merge the main branch in before merging.
