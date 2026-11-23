# Plan: terminal-prints-cockpit-views

## Goal
`cockpit overview | inbox | project <owner/name> [--json]` prints, from a terminal with a read token, the same values
as the screens (FR-15, G-5). No token or an unreachable COCKPIT exits non-zero with a message naming the cause and
no stack trace.

## Approach
The CLI is a thin MCP client: one `tools/call` over `fetch` to `<url>/api/mcp` with `Authorization: Bearer
<COCKPIT_TOKEN>`, the answer read between the untrusted-data markers, narrowed with zod, then printed as plain text
tables (or the parsed answer as JSON with `--json`). The row wording comes from the same helpers the screens use,
moved out of the React components into plain modules.

- `src/overview/describe-overview-row.ts`: `describeRoadmap`, `describeRelease`, `describeRun`, `describeDoctor`
  (moved from `overview-row.tsx`, which imports them).
- `src/inbox/describe-age.ts`: `describeAge` (moved from `inbox-row.tsx`).
- `cli/call-tool.ts`: `callTool({ url, token, name, args, fetch })` → `Result<unknown, CliFailure>`; failures are a
  discriminated union (`unreachable`, `unauthorized`, `http_status`, `tool_error` with the server's text,
  `bad_answer`).
- `cli/answer-schemas.ts`: zod schemas of the three answers (the shapes of `src/mcp/answers.ts`).
- `cli/render-table.ts`: `renderTable(headers, rows)`: padded columns, control characters stripped from cells.
- `cli/render-views.ts`: `renderOverview`, `renderInbox`, `renderProject` with `en.overview`, `en.inbox`, `en.cli`.
- `cli/run-cli.ts`: `runCli(argv, { env, fetch, stdout, stderr })` → exit code (0 ok, 1 failure, 2 usage).
- `cli/bin.ts`: `#!/usr/bin/env node` entry; `package.json` gets `"bin": { "cockpit": "cli/bin.ts" }` and the
  script `"cockpit": "node cli/bin.ts"`.
- `messages/en.ts`: a `cli` namespace (usage, column headers, error messages).

## Phase 1: Client, tables and commands (TDD)
- Tests first (`tests/cli/*.test.ts`): the CLI against the real endpoint (`createMcpEndpoint` with the MCP tests'
  fixture reader and an issued read token, `fetch` routed to it): overview table rows and groups, inbox table and
  history, project table, `--json` equal to the tool answer, no token (exit 2), refused token (exit 1, names the
  token), unreachable (exit 1, names the URL), unknown project (exit 1, the server's hint), unknown command (usage),
  control characters stripped. `renderTable` alone: alignment, empty rows.
- Then the modules above; the screen components import the moved helpers (their existing tests keep passing).
- Done when: the tests pass and the gates are green.

## Phase 2: The real binary against the running app (e2e)
- `e2e/cli.spec.ts` with an unused fixture repository (`example-org/tau-app` in `e2e/fake-forge.ts`): watch it, scan,
  create a read token on the token page, run `node cli/bin.ts overview|inbox|project` as a child process with
  `COCKPIT_URL`, `COCKPIT_TOKEN` and `TZ` set; the tau row's cells equal the screen's chips; `--json` parses; no
  token exits 2 with the message; an unreachable URL exits 1 with no stack.
- README: a short "Terminal" section (token, env, commands).
- Done when: e2e passes after `npm run build`, gates green.

## Risks and rollback
- Additive: a new folder, a `bin`, a script, copy keys, and two helpers moved without behaviour change. Rollback is a
  revert of the merge.

## Decisions (auto)
- Token only from `COCKPIT_TOKEN` (no flag): it never appears in shell history or `ps`.
- Times in the terminal's zone (the owner's), same format as the screens (`createTimeFormatter`).
- Node's own type stripping instead of `tsx` for the bin: no dev dependency at run time; bundling for an npm install
  is CMP-18's.
- Overview printed as one table per status group, in the screen's order, headed by the screen's status label.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Client, tables and commands

#### Automated
- [x] 1.1 CLI tests pass against the real endpoint: three tables, `--json`, no token, refused token, unreachable, unknown project, usage, control characters — 627350a
- [x] 1.2 Screen helpers moved; existing overview and inbox tests pass — 627350a
- [x] 1.3 Gates green (typecheck, lint, test) — 627350a

### Phase 2: The real binary against the running app

#### Automated
- [x] 2.1 `e2e/cli.spec.ts` passes: the binary prints the tau row equal to the screen, JSON, no token, unreachable — a6d49cb
- [x] 2.2 Gates green and build — a6d49cb
