# Research: assistant-answers-entries-over-mcp

Date: 2026-11-23 · Base: master 7aedbdb · Module: `@softure-ai/mcp-access` 0.7.8 (README §1, §3, §4, §7 read)

## How it works today
- The one write (FR-5) is `answerEntry` in `src/decisions/answer-entry.ts`: it checks the note, the forge client,
  the watched project, that the entry id is still in the stored scan and that its text equals the text the owner
  saw (`entry_changed` otherwise); then it claims the answer in the database (one row per entry text), checks the
  `owner-word` label, creates one issue with the marker, and records it as sent. A second answer of the same entry
  returns the first (`alreadyAnswered: true`), a concurrent one gets `answer_in_progress`. Every failure is a
  `decisions.*` code; the inbox action maps it to `en.inbox.errors.<key>`.
- The inbox action (`app/(app)/inbox/answer/actions.ts`) wires `getDatabase()`, `getForgeClient()`, `systemClock`
  and the signed-in user's id, then calls `answerEntry`.
- MCP (CMP-14): `createCockpitServerFactory({ reader, buildInfo })` registers three read tools for every token;
  `softure.config.ts` sets `allowWrites: false`; the catalog (`src/mcp/tool-catalog.ts`) lists read tools only.
  Entry texts reach the assistant wrapped, with any marker inside them defused by a zero-width joiner.
- Tests: `tests/mcp/server.test.ts` drives the endpoint with a read token; `tests/decisions/answer-entry.test.ts`
  drives the rule with a memory forge (`tests/support/memory-forge.ts`) on a PGlite test context. The e2e
  `e2e/mcp.spec.ts` asserts the token page offers no write access and the 401 challenge asks for `mcp:read` only.

## What the module gives for writes
- The identity passed to `registerTools` carries `{ userId, canWrite, tokenId }`. `canWrite` is true only when the
  app allows writes (`allowWrites`, and the `mcp-access.writes_enabled` switch when the app defines one) and the
  token (or OAuth grant with `mcp:write`) was issued with write access. Register write tools only when `canWrite`:
  a read token never sees the tool, and calling it is refused as an unknown tool.
- `allowWrites: true` lets the token page offer "Allow changes" and the OAuth challenge ask for `mcp:write`.
  The README recommends reading it from the environment (`MCP_ALLOW_WRITES === "1"`).
- `withToolErrors(work, { hints })` maps a result's error code to a hint text; `measureServedToolLists` measures
  the list per access level; `expectToolCatalogMatchesServer` checks catalog parity (write tools included).
- `defuse(text)` on the untrusted wrapper gives the text exactly as the assistant read it.

## Files the change touches
`softure.config.ts` (allowWrites), `src/mcp/cockpit-server.ts` (write tool), `src/mcp/answer-tool.ts` (new: input
and mapping), `src/mcp/create-server.ts` (production wiring), `src/mcp/tool-catalog.ts`, `messages/en.ts`
(`mcp.tools.answerEntry`, `mcp.instructions`), `README.md` (MCP section), `tests/mcp/**`, `tests/config.test.ts`,
`e2e/mcp.spec.ts`, `e2e/fake-forge.ts` (one new fictional repository). No migration.

## Risks
- A second path to the only write: it must call `answerEntry`, never a copy (roadmap risk).
- The assistant copies the entry text it read; a text with a defused marker differs from the stored text by the
  joiners, which would wrongly give `entry_changed`. Map a text equal to `defuse(stored)` back to the stored text.
- Prompt injection: a hostile entry text could ask the assistant to answer entries. Writes need a write token or
  grant the owner issued on purpose, the answer is reversible on the forge (close the issue), and the text the
  assistant must pass pins the answer to an entry the owner could read. `withConfirmation` was considered and not
  used: it needs a new secret (an owner step) and, by its own README, does not stop an injected assistant.
- Parallel threads (CMP-17 CLI) may touch `e2e/mcp.spec.ts` / `e2e/fake-forge.ts`: merge master in before merging.

## Unknowns answered
- Does an answer over MCP mark the entry "sent" in the inbox? Yes: the inbox builds answer state from the stored
  answers, which `answerEntry` writes; nothing else is needed.
- Default for `allowWrites`: see the plan's decisions.
