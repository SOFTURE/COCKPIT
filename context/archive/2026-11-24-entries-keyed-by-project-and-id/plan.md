# Plan: entries-keyed-by-project-and-id

## Approach
Prove the project + id key with tests on every path the item names (answers rule, inbox rows and history, digest,
MCP `answer_entry`, row markup), each using two fictional projects whose queues carry the same entry id and text, and
fix what fails. Research expects one failure: the inbox row's `data-entry` names the id alone; it becomes
`<projectKey>:<id>`, the same key the inbox page already uses for React.

## Key decisions
- Test-first, one phase: the tests are the deliverable; code changes only where a test is red.
- `data-entry` carries `projectKey:id` (one attribute, matches the page's React key) rather than adding a second
  attribute.
- The MCP proof is a unit test of `toEntryAnswerRequest` plus the existing end-to-end MCP answer test (which goes
  through the same rule the decisions test covers with two repositories); no second memory forge.

## Phase 1: Two projects, one entry id (TDD)
- `tests/decisions/answer-entry.test.ts`: a second repository with the same entry; answering beta leaves alpha
  unanswered, then answering alpha creates its own claim (two rows in `projects.answers`).
- `tests/inbox/build-inbox.test.ts`: two sources, same id and text; an answer recorded for one project and a marker
  issue in neither: one row sent, the other open; when both entries leave, each history row names its own project.
- `tests/digest/compare-snapshots.test.ts`: a new entry in beta with an id already open in alpha is a waiting line
  for beta.
- `tests/mcp/answer-tool.test.ts` (new): two inbox rows with the same id; the defused text of beta's row resolves to
  beta's real text, alpha's text never stands in.
- `tests/inbox/inbox-row-markup.test.tsx` (new): two rows with the same id render distinct `data-entry` values naming
  the project.
- Fix `src/inbox/inbox-row.tsx` for the markup test.

Done when: the new tests fail before the fix only where research predicted (markup), pass after; gates green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Two projects, one entry id

#### Automated
- [x] 1.1 Answers rule, inbox rows and history, digest and MCP request tests pass with two projects sharing an id (answers rule, inbox, digest, MCP request: 4 new tests, green with no code change) — 80e200e
- [x] 1.2 Row markup test red before the fix, green after (red: `oq-shared` twice; green: `example-org/alpha-app:oq-shared`, `example-org/beta-app:oq-shared`) — 80e200e
- [x] 1.3 Gates green: typecheck, lint, test (typecheck, lint, test 538/538) — 80e200e
