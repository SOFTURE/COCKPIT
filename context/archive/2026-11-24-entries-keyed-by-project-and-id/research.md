# Research: entries-keyed-by-project-and-id

Date: 2026-11-24. Base: master @ 16428c2 (after the inbox project-tabs change, PR #69).

## Question
Is any part of the answer path keyed by the owner-queue entry id alone, so that two watched projects whose queues
carry the same id (and text) could mix answers, history or digest lines?

## Findings, path by path
| Path | Key today | Evidence |
| --- | --- | --- |
| Stored answers | `repository_key, entry_id, md5(entry_text)` | `modules/projects/answers.ts` `claimAnswer` (`on conflict (repository_key, entry_id, md5(entry_text))`, lookup by both) |
| Answer rule | project then id | `src/decisions/answer-entry.ts` `findTarget` picks the repository by key, then the entry in that repository's read; `findLeftBehindIssue` lists that repository's issues and claims `repositoryKey#number` |
| Inbox rows | answers and marker issues per source | `src/inbox/build-inbox.ts` filters `answers` by `repositoryKey === source.key`; marker answers come from the source's own issues |
| History | per source | same filter; answers of unwatched projects keep their `fullName` |
| Inbox page | React key `projectKey:id`; form posts `repositoryKey` + `entryId` | `app/(app)/inbox/page.tsx`, `src/inbox/answer-form.tsx` |
| Inbox row markup | **id alone**: `data-entry={entry.id}` | `src/inbox/inbox-row.tsx:32` |
| Digest | `openBefore` set built per project | `src/digest/compare-snapshots.ts`; snapshot rows filtered by `projectKey` in `src/digest/build-snapshot.ts` |
| MCP `answer_entry` | row found by `projectKey` and `entry.id` | `src/mcp/answer-tool.ts` `toEntryAnswerRequest` |
| MCP reads | every entry carries `project` | `src/mcp/answers.ts` |

No test covers two projects with the same entry id. The only id-alone key is the row's `data-entry` attribute
(nothing reads it today; e2e does not select by it), which would name two rows the same.

## Test seams
- `buildInbox` is pure (`tests/inbox/build-inbox.test.ts`).
- `compareSnapshots` is pure (`tests/digest/compare-snapshots.test.ts`).
- `answerEntry` runs on PGlite with a memory forge (`tests/decisions/answer-entry.test.ts`); the memory forge serves
  one repository, enough to answer one project and see the other's identical entry still unanswered.
- `toEntryAnswerRequest` is pure (`src/mcp/answer-tool.ts`); the defused-text resolution looks the row up by project
  and id, so two projects whose texts differ only in a marker prove it picks the named project's row.
- `InboxRow` renders with `renderToStaticMarkup` (pattern: `tests/shell/page-layout-markup.test.tsx`).

## SOFTURE modules
None needed: no generic capability involved.

## Risks
None: tests plus a one-attribute markup change.
