# Research: terminal-prints-cockpit-views

Date: 2026-11-23 · Base: master 7aedbdb · Inputs: PRD FR-15 and G-5, CMP-14's archive, `@softure-ai/mcp-access` 0.7.8 README

## How it works today
- No CLI. `package.json` has no `bin`; scripts run TypeScript through `tsx` (`migrate`, `worker`, `create-account`).
- CMP-14 serves `POST /api/mcp` (`app/api/mcp/route.ts`, `createMcpRoute`) with three read tools: `get_overview`,
  `get_inbox`, `get_project` (`src/mcp/cockpit-server.ts`). Each answers indented JSON between the markers
  `<<<cockpit:untrusted-data>>>` / `<<<cockpit:end-untrusted-data>>>` (`messages/en.ts` → `mcp`); a marker inside
  repository text is defused with a zero-width joiner, so the answer sits between the first open marker and the
  last close marker.
- The answer shapes are in `src/mcp/answers.ts`: overview groups (status, projects with `numbers`, `release`, `ci`,
  `qualityReview`, `doctor`, `read`), inbox (`unansweredCount`, `entries`, `history`), project detail (`project`,
  `entries`). Dates are ISO text.
- The endpoint is stateless: a request without a session id is served (no `initialize` needed); a 2025-06-18
  client gets one SSE `message` event, a 2026-07-28 client plain JSON (`tests/mcp/server.test.ts` and
  `e2e/mcp.spec.ts` both read either). No token or a revoked one: `401` with a `WWW-Authenticate` challenge. An
  unknown project: a tool result with `isError: true` and the hint text from `en.mcp.errors`.
- Read tokens come from the token page (`/account/mcp`, `sftmcp_…`), shown once.
- The screens' wording lives in `messages/en.ts` (`overview`, `inbox`). The value wording of a row is computed
  inside React components: `describeRelease`, `describeRun`, `describeDoctor` in `src/overview/overview-row.tsx`,
  `describeAge` in `src/inbox/inbox-row.tsx`; times through `createTimeFormatter(locale, timeZone)`
  (`src/projects/format-time.ts`, the app's `config.timezone`).

## What modules give
- `@softure-ai/mcp-access` has no client and its CLI (`softure-mcp`) only prunes; the MCP SDK installed is the
  server package only. A JSON-RPC `tools/call` over `fetch` is a dozen lines, as the tests already do; no new
  dependency. Not a gap worth an issue: the endpoint is plain HTTP by design.
- Node 22.23 strips types natively: `node cli/bin.ts` runs the repository's `.ts` imports (`messages/en.ts`, zod,
  `@softure-ai/core`) without `tsx` and without a warning (checked in this session).

## Risks
- Repository text reaches the terminal: control characters (ANSI escapes) in an entry must not reach the terminal
  raw. Cells are stripped of control characters; JSON output escapes them already.
- The tool answer is external data: narrowed with zod at the boundary; an answer that does not match exits non-zero
  with a message, never a stack.
- Wording drift between screen and CLI: avoided by moving the `describe*` helpers out of the components into plain
  modules both use.
- Time zone: the server formats in `config.timezone`; the CLI formats in the terminal's zone (`TZ`), which is the
  owner's zone in practice. The e2e runs the CLI with `TZ` set to the app's zone.

## Unknowns answered
- API: the MCP read tools, as the roadmap's risk line says; no endpoint of its own.
- Token transport: environment variable `COCKPIT_TOKEN` (never a flag, so it stays out of shell history and
  process lists); URL from `--url` or `COCKPIT_URL`.
- Publishing the CLI (`bin` for an installed package, bundling) is CMP-18; this item adds the `bin` entry and an npm
  script for use from a checkout.
