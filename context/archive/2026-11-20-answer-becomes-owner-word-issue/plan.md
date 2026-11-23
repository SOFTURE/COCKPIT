# Plan: answer-becomes-owner-word-issue

## Goal
The owner answers an inbox entry Yes, No or Later with an optional note and confirms; exactly one issue labelled
`owner-word` is created in that project with the entry, the answer, the note and the marker
`<!-- owner-word: {"entry": "<id>", "answer": "yes|no|later"} -->`; the entry shows "sent" with the link, "done"
once the issue is closed, and "the entry changed since" when the project rewords it. Out of scope: answering over
MCP (CMP-15, which reuses this rule), naming teammates in the issue (CMP-17).

## Approach
**Starting point:** the inbox lists entries and reads markers from the stored owner-word issues (CMP-4).

**Chosen:** `src/decisions/answer-entry.ts` holds the one rule: check the entry is still in the stored state, claim
it with an insert under a unique index, check the label, create the issue, record it as sent; on failure release
the claim (after looking for an issue a timed-out request may have created). The forge client gains `hasLabel` and
`createIssue` (`src/forge/issues.ts`), its only write. The inbox merges the answers table with the issue markers.
Rejected: deduplicating by reading the forge before every write (a race between two requests still creates two).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| One issue per answer | unique index `(repository_key, entry_id, md5(entry_text))`, claim before the forge call | FR-5 twice at once | research |
| Failure | release the claim, show a fixed message per kind | FR-5, NFR-6 | PRD |
| Timeout | adopt an issue with the marker created after the claim | no duplicate after a lost answer | research |
| Stuck claim | a `creating` row older than 10 minutes is taken over | an entry never stays stuck | research |
| Reworded entry | answers keep the text; claimed issues are not matched by marker | FR-6 | research |
| Issue body | entry text quoted, kind, source, item, entry id, answer, note, marker; no person | FR-5, NFR-8 | PRD |
| Confirm | choose an answer, then a confirm step shows the answer and the note | FR-5 "and confirms" | PRD |

## Phase 1: The answer rule and the forge write
**Discipline:** TDD. **Files:** `modules/projects/migrations/0003_create_answers.sql`, `modules/projects/schema.ts`,
`modules/projects/answers.ts`, `src/forge/issues.ts`, `src/forge/client.ts`, `src/decisions/**`,
`tests/decisions/**`, `tests/forge/**`, `tests/support/fake-forge-routes.ts`.

1. Migration 0003: `projects.answers` (id, repository_key, full_name, entry_id, entry_text, entry_kind, entry_source,
   entry_item, answer, note, answered_by, answered_at, status `creating|sent`, issue_number, issue_url) with the
   unique index and checks (a sent row has its issue).
2. `modules/projects/answers.ts`: `claimAnswer`, `takeOverStaleClaim`, `markAnswerSent`, `releaseAnswer`,
   `findAnswers`.
3. `src/forge/issues.ts`: `formatOwnerWordIssue(entry, answer, note)` → `{ title, body }`; the client gets
   `hasLabel(owner, name, label)` and `createIssue(owner, name, issue)`.
4. `src/decisions/answer-entry.ts`: `answerEntry({ db, client, clock, user, repositoryKey, entryId, entryText,
   answer, note })` → `Result<{ issueNumber, issueUrl, alreadyAnswered }, AnswerErrorCode>`.

**Tests:** `tests/decisions/answer-entry.test.ts` (one issue with the marker and the entry; twice at once → one
issue, one answer; label missing → refused, nothing posted, nothing recorded; forge refuses or is down → entry stays
unanswered with the reason; timeout with the issue created → adopted; stale claim taken over; entry no longer in
the state → refused; a reworded entry can be answered again), `tests/forge/no-other-writes.test.ts` (every client
method against a fake fetch: the only write is `POST /repos/{o}/{r}/issues`), `tests/forge/issues.test.ts`.

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Answer controls and answer states in the inbox
**Discipline:** test-after. **Files:** `src/inbox/**`, `app/(app)/inbox/**`, `messages/en.ts`, `e2e/fake-forge.ts`,
`e2e/answer.spec.ts`, `tests/inbox/**`.

1. `buildInbox` takes the answers: current-text answer → sending, sent or done (done when the scanned issue with
   that number is closed); an answer for older text → the row is open and shows "the entry changed since"; markers
   of issues no answer claims count as before; answers whose entry left the state → `history`.
2. Answer form (client): Yes, No, Later buttons, an optional note, a confirm step with Send and Back; every control
   at least 44 px high; the result or the failure reason shown in the row.
3. Server action `answerEntryAction` (requireUser, zod-checked form) calls `answerEntry`.
4. "Answered earlier" section with the issue links.
5. The fake forge serves `labels/owner-word`, accepts `POST /issues` and lists the created issues.

**Tests:** `tests/inbox/build-inbox.test.ts` (sending, sent, done by issue number, changed since, history, claimed
issue not matched again); e2e `e2e/answer.spec.ts` (answer with a note → "sent" with the issue link, the fake forge
holds one issue with the marker; a repository without the label shows the reason and stays unanswered; answer
controls at least 44 px high at 390 px).

**Done when:**
- Automated: the tests and the e2e pass; Gates green.
- Manual: the answer form and states render on the theme in light and dark at 390 px and desktop (evidence:
  Playwright screenshots the run inspects).

## Risks and rollback
- The only write toward watched repositories; guarded by the no-other-writes test. Rollback: revert the merge and
  run the migration's rollback; issues already created stay in the projects (they are the owner's words).

## Decisions (auto)
- The issue names no person in this item; CMP-17 adds attribution.
- A stale claim is 10 minutes old.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: The answer rule and the forge write

#### Automated
- [x] 1.1 `tests/decisions/answer-entry.test.ts` passes: one issue, twice at once, label missing, refused, timeout, stale claim, reworded — dd5f3fe
- [x] 1.2 `tests/forge/no-other-writes.test.ts` passes: the only write is creating an issue — dd5f3fe
- [x] 1.3 Gates green (typecheck, lint, test) — dd5f3fe

### Phase 2: Answer controls and answer states in the inbox

#### Automated
- [x] 2.1 `tests/inbox/build-inbox.test.ts` passes: sending, sent, done, changed since, history — 0bffe73
- [x] 2.2 `e2e/answer.spec.ts` passes: sent with link and one issue, label missing, 44 px controls at 390 px — 0bffe73
- [x] 2.3 Gates green (typecheck, lint, test) — 0bffe73

#### Manual
- [x] 2.4 The answer form and states render on the theme in light and dark at 390 px and desktop (evidence: Playwright screenshots the run inspects) — 0bffe73 (verified by agent: Playwright screenshots of open, confirm, failed and sent states at 390 px and 1280 px in light and dark, inspected; stored in the project files at /mnt/project-files/cockpit/evidence/answer-becomes-owner-word-issue/)
