# Plan: assistant-answers-entries-over-mcp

## Goal
With a write token (or an OAuth grant with write access), the owner answers an entry Yes, No or Later, with an
optional note, through an assistant; the answer goes through the inbox's own rule: one owner-word issue, the entry
shows sent, a second answer returns the first. A read token never sees the tool and nothing is written. Out of
scope: the CLI (CMP-17), the release (CMP-16).

## Approach
**Starting point:** answers only from the inbox; MCP serves three read tools with `allowWrites: false`.

**Chosen:** turn writes on in `mcpAccess` and register one write tool, `answer_entry`, only when the identity can
write. The tool parses its input, finds the entry in the same inbox the read tools answer from (to accept the text
exactly as the assistant read it), then calls `answerEntry` with the token's account as the answerer. The server
factory takes an `answer` seam next to the reader so tests inject the real rule on a test database and a memory
forge. Rejected: a copy of the rule for MCP (the roadmap's risk), and `actionTool` over the inbox's server action
(it calls `requireUser`, a session cookie a token request does not have).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Tool | `answer_entry({ project, entry, text, answer, note? })` | FR-14; `text` pins the answer to what was read, as the inbox form does | PRD, CMP-5 |
| Writes switch | `allowWrites: process.env.MCP_ALLOW_WRITES !== "0"` | on by default, so no new owner step; a write still needs a write token or grant the owner issues on purpose; `MCP_ALLOW_WRITES=0` turns every token read-only | module README §3 (adapted) |
| Defused text | a `text` equal to `defuse(stored text)` counts as the stored text | the assistant read the defused form | research |
| Errors | `decisions.*` codes answered with the inbox's own messages (`en.inbox.errors`) as hints; project name errors reuse `mcp.errors` | one rule, one wording | CMP-5 |
| Answer value | `{ project, entry, answer, issueNumber, issueUrl, alreadyAnswered }` as plain JSON | values COCKPIT wrote, no repository text | — |
| Annotations | `readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true` | a repeat returns the first answer; it writes to the forge | — |
| Confirmation | none (`withConfirmation` not used) | needs a new secret; does not stop an injected assistant (module README); the issue can be closed | research |

## Phase 1: Write tool through the inbox's rule
**Discipline:** TDD. **Files:** `softure.config.ts`, `src/mcp/answer-tool.ts`, `src/mcp/cockpit-server.ts`,
`src/mcp/create-server.ts`, `src/mcp/tool-catalog.ts`, `messages/en.ts`, `tests/mcp/server.test.ts`,
`tests/mcp/answer-tool.test.ts`, `tests/config.test.ts`.

**Tests:**
- `tests/mcp/server.test.ts`: catalog parity with the write tool; a read token lists the three read tools and
  calling `answer_entry` is refused with nothing written; a write token lists `answer_entry`; answering through the
  tool (real `answerEntry`, test database, memory forge) creates exactly one owner-word issue with the marker and
  the note, the inbox then shows the entry sent; answering again returns the existing issue
  (`alreadyAnswered: true`) and creates none; the defused hostile text is accepted; a changed text and an unknown
  project come back as tool errors with the inbox's wording.
- `tests/config.test.ts`: writes allowed by default and off with `MCP_ALLOW_WRITES=0` (the option is read at
  config load: test the expression through a small exported helper).

**Done when:**
- Automated: the tests pass; gates green (typecheck, lint, test).

## Phase 2: Token page and endpoint e2e, docs
**Discipline:** test-after. **Files:** `e2e/mcp.spec.ts`, `e2e/fake-forge.ts`, `README.md`.

**Tests:** `e2e/mcp.spec.ts`: the read-token test no longer expects the absence of "Allow changes" and the 401
challenge now asks for `mcp:write` too; a new test issues a write token ("Allow changes" ticked), answers an
entry of a fresh fictional repository through `answer_entry`, finds exactly one issue on the fake forge and the
entry shown as sent in the inbox.

**Done when:**
- Automated: `npm run build && npm run e2e` green; gates green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Write tool through the inbox's rule

#### Automated
- [ ] 1.1 Server tests pass: catalog parity, read token refused with nothing written, write token answers once, repeat returns the first, defused text accepted, errors worded as the inbox
- [ ] 1.2 Config test passes: writes on by default, off with `MCP_ALLOW_WRITES=0`
- [ ] 1.3 Gates green (typecheck, lint, test)

### Phase 2: Token page and endpoint e2e, docs

#### Automated
- [ ] 2.1 `e2e/mcp.spec.ts` passes: write token answers through the tool, one issue on the forge, entry sent in the inbox
- [ ] 2.2 Gates green (typecheck, lint, test) and build

## Decisions (auto)
- `allowWrites` on by default (`MCP_ALLOW_WRITES=0` turns it off): no new owner step before the deploy; writes still
  need a write token or grant.
- No `withConfirmation`: see Key decisions.
- `frame` skipped (change.md Notes).
