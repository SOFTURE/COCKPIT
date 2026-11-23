# Plan: assistant-reads-cockpit-over-mcp

## Goal
The owner issues a read token (or connects an assistant through OAuth) and asks for the overview, the inbox and a
project's detail; the answers hold the same values as the screens. No token or a revoked one gets nothing; no tool
answers an entry. Out of scope: answering over MCP (CMP-15), the CLI (CMP-17).

## Approach
**Starting point:** no MCP; the screens build their values from `loadInbox` / `loadOverview`.

**Chosen:** adopt `@softure-ai/mcp-access` with OAuth on and writes off. COCKPIT's server (`src/mcp/**`) has three
read tools, `get_overview`, `get_inbox` and `get_project`, each built from the same loaders the screens use through
a small reader seam (`CockpitReader`) so tests inject fixtures. Answers are JSON wrapped in untrusted-data markers.
Rejected: a second query path for MCP (two sources of truth for the same numbers).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Tools | `get_overview`, `get_inbox`, `get_project({ project })` | FR-13's three reads | PRD |
| Values | mapped from `Overview`, `Inbox` the screens render | "answers match the screens" | change |
| Project detail | overview row + its inbox entries | the page is a placeholder until CMP-9 | research |
| Writes | `allowWrites: false` | CMP-15 adds them | roadmap |
| OAuth | enabled, open registration | phone path through hosted assistants | research |
| Untrusted text | `createUntrustedWrapper`, markers named in the server instructions | text from repositories | module README |
| Token page | `/account/mcp`, linked from Settings | module default | module README |
| Prune | `mcpAccessJobSchedules` / handlers | worker already runs jobs | module README |

## Phase 1: Server, tools and the endpoint
**Discipline:** TDD (tool answers). **Files:** `package.json`, `softure.config.ts`, `src/mcp/**`,
`src/jobs/handlers.ts`, `app/api/mcp/route.ts`, `messages/en.ts` (`mcp.*`), `proxy.ts`, `tests/mcp/**`.

**Tests:** `tests/mcp/answers.test.ts` (overview, inbox, project mapping from fixtures; unknown project; empty),
`tests/mcp/server.test.ts` (catalog parity; tool lists snapshot; each tool returns the fixture data through an
in-memory client; untrusted text is wrapped and defused), `tests/mcp/endpoint.test.ts` (no token and a revoked
token get 401 without data; a read token lists the three read tools and no write tool).

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Token page, OAuth and the screens parity e2e
**Discipline:** test-after (wiring). **Files:** `app/account/mcp/page.tsx`, `app/oauth/authorize/page.tsx`,
`app/api/oauth/**`, `app/.well-known/**`, `next.config.ts`, `app/(app)/settings/page.tsx`, `messages/en.ts`,
`e2e/mcp.spec.ts`, `README.md` (connecting an assistant), `tsconfig.json`, `proxy.ts`.

**Tests:** e2e: the owner opens Settings → assistant access, issues a read token, calls `get_inbox`,
`get_overview` and `get_project` over HTTP and finds the same entry texts, counts and status as the inbox and the
overview screens; the OAuth discovery documents answer; a request without a token gets 401.

**Done when:**
- Automated: the e2e passes; Gates green; build passes.
- Manual: the token page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright
  screenshots the run inspects).

## Risks and rollback
- A hosted client caches tool lists: the version follows the tool list and `get_server_info` answers the contract.
- Rollback: revert the merge; the `mcp` schema can stay (unused) or be dropped (`DROP SCHEMA mcp CASCADE` and the
  module's `softure.migrations` rows).

## Decisions (auto)
- OAuth registration open (see research); writes off until CMP-15.
- Project detail = overview row + entries; CMP-9 may extend `get_project` when the page grows.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Server, tools and the endpoint

#### Automated
- [ ] 1.1 Answer mapping tests pass: overview, inbox, project, unknown project, empty
- [ ] 1.2 Server tests pass: catalog parity, tool lists, fixture data through a client, untrusted text wrapped
- [ ] 1.3 Endpoint tests pass: no token and revoked token refused, read token lists no write tool
- [ ] 1.4 Gates green (typecheck, lint, test)

### Phase 2: Token page, OAuth and the screens parity e2e

#### Automated
- [ ] 2.1 `e2e/mcp.spec.ts` passes: token issued, three tools match the screens, discovery answers, 401 without token
- [ ] 2.2 Gates green (typecheck, lint, test) and build

#### Manual
- [ ] 2.3 Token page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspects)
