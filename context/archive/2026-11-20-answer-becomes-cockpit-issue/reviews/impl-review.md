# Implementation review: answer-becomes-cockpit-issue

Scope: full · Date: 2026-11-23 · Commits: dd5f3fe..884e149 · Gates: typecheck ✓, lint ✓ (ESLint + language), test ✓ (82); integration: build ✓, e2e ✓ (17)

## Verdict
Ready after fixes (both applied in 884e149). The answer rule claims the entry text under a unique index before the
forge call, checks the label, creates one issue and records it; a failure releases the claim, a lost answer adopts
the issue it left behind, and a claim stuck for ten minutes is taken over. The inbox merges the recorded answers
with the scanned markers. Two defects were found and fixed: a taken-over claim recorded the wrong answer when it
adopted the dead request's issue, and a marker quoted from the entry text or the note could pass for the issue's own.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | no MCP answers (CMP-15), no attribution (CMP-17) |
| Progress honesty | PASS | Progress was unticked at review start; ticked with the phase SHAs after re-running every criterion |
| Correctness | PASS after fix | F1 |
| Tests | PASS | twice at once → one issue; label missing; refused; timeout adopted; stale claim; reworded; no other writes |
| Data and migrations | PASS | 0003 forward-only with rollback note; unique index and checks in the database |
| Security | PASS after fix | F2; action behind `requireUser`, form narrowed with zod |
| Architecture and patterns | PASS | |
| Lessons | PASS | no lessons recorded yet |

## Plan coverage
| Phase | Commit | Delivered | Notes |
|---|---|---|---|
| 1 | dd5f3fe | yes | |
| 2 | 0bffe73 | yes | |

Files: planned and changed 27 · unplanned 2 (`src/state/stored-entries.ts`, shared entry narrowing pulled out of
`build-inbox.ts` for the answer rule; `tests/support/memory-forge.ts`, the plan's `fake-forge-routes.ts` grew into a
stateful forge) · planned, not changed 0.

## Findings
### F1 [WARNING] A taken-over claim adopting the dead request's issue records the new request's answer
**Impact:** LOW (obvious, narrow fix) · **Dimension:** Correctness · **Where:** src/decisions/answer-entry.ts:181
**What:** `takeOverStaleClaim` overwrites answer, note and author with the new request's values; when the dead
request's issue is then found and adopted, the row was marked sent with those new values while the issue carries the
old answer. **Why it matters:** the inbox would show "Yes · issue #1" for an issue that says No.
**Evidence:** the stale-claim test, extended to read the stored row, returned `yes` instead of `no`.
**Fix:** `markAnswerSent` takes optional values; the adoption restores the dead request's answer, note, author and time.
**Decision:** fix now (884e149)

### F2 [WARNING] A marker inside the quoted entry text or note could pass for the issue's own
**Impact:** LOW (obvious, narrow fix) · **Dimension:** Security · **Where:** src/forge/issues.ts:16
**What:** the body quotes the entry text (written by the watched project) and the note before the real marker, and
`parseOwnerWordMarker` reads the first match. **Why it matters:** an entry text holding a marker for another entry
would make the scan, and the project's coordinator, read an answer the owner never gave.
**Evidence:** a new test with a forged marker in the text and the note parsed `oq-other`/`yes`.
**Fix:** quoted text escapes `<!--` as `&lt;!--`.
**Decision:** fix now (884e149)

### F3 [SUGGESTION] The note limit is a literal in the client form
**Impact:** LOW · **Dimension:** Architecture and patterns · **Where:** src/inbox/answer-form.tsx:59
**What:** `maxLength={2000}` repeats `MAX_NOTE_LENGTH`; the server rule and the database check still hold the limit.
**Decision:** accept: importing the rule module into a client component would pull server code into the bundle.

## Progress audit
Every item re-run in this session: unit tests (82), e2e (17, Chromium from the preinstalled path), gates. Item 2.4:
sixteen screenshots (open, confirm, failed, sent × 390/1280 px × light/dark) inspected; stored in the project files
at `/mnt/project-files/cockpit/evidence/answer-becomes-cockpit-issue/` (no evidence store configured yet).

## Triage summary
3 findings: 2 fix now, 1 accept.

## Lessons proposed
None.

## Decisions (auto)
- F1, F2: fix now (clear local fixes, tests first, red before the fix).
- F3: accept (suggestion, the fix would cross the client/server boundary).
- 2.4 settled by the run's own screenshots, not left for the owner.
