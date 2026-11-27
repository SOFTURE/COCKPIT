# Research: answer-done-by-issue-number

## How it works today
- `projects.answers` (migration 0003) keeps every answer with `status` (`creating` | `sent`), `issue_number` and
  `issue_url`; nothing records the issue's state.
- The scan (`src/scan/scan-projects.ts`) reads per project the state file, `listCockpitIssues` (labelled `cockpit`,
  open and closed), the forge facts and the adapters, and stores the issues in `projects.reads.issues`.
- `buildInbox` builds `closed` from those stored issues; `toAnswerState` (open rows) and `toHistoryRow` (history)
  read `closed.has(issueNumber)`. Answers of projects no longer watched get an empty set, so they are never done.
- The same `buildInbox` feeds the inbox page (`load-inbox.ts`), the digest (`digest/build-snapshot.ts`) and the MCP
  answers (`mcp/answers.ts`), so a fix in `buildInbox` reaches all three.
- The forge client has a generic `getJson(path, schema)`, routed per repository by the token router; `runs.ts` reads
  through it the same way.

## Touched
- `modules/projects/migrations/0012_add_answer_issue_closed_at.sql`, `modules/projects/schema.ts`,
  `modules/projects/answers.ts`: the answer keeps when its issue was seen closed.
- `src/forge/issue-state.ts` (new): reads one issue's state by number.
- `src/scan/scan-projects.ts`: for each sent answer of the project not yet closed, take the state from the listed
  cockpit issues or read the issue by number, and record a closed one.
- `src/inbox/build-inbox.ts`: done when the stored closure is set, or the listed issue is closed.
- Tests: `tests/inbox/build-inbox.test.ts`, `tests/scan/scan-projects.test.ts`, `tests/projects/*`.

## Risks
- Forge budget: one GET per not-done answer whose issue is not in the labelled list. Nine today, and each stops once
  closed; far under NFR-2.
- A closed issue reopened later stays done: the answer was settled; out of scope.

## SOFTURE modules
- `@softure-ai/db` migrations and `@softure-ai/core` results are used as elsewhere; no new package need.
