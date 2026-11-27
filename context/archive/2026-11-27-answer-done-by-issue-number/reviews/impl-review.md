# Implementation review: answer-done-by-issue-number

Verdict: approved, no open findings.

- Plan drift: none. Migration 0012, store functions, `readIssueState`, the scan step and `buildInbox` as planned.
- Plan-review fix 1 holds: closures are read before any write and a rate limit returns before `recordRead`.
- Correctness: an issue in the labelled list costs no extra request; a failed read (not a rate limit) leaves the
  answer for the next scan; a recorded closure is never overwritten (`isNull` guard) and only a sent answer can
  carry one (table check, tested).
- Tests: build-inbox (stored closure, unwatched project), scan (unlabelled closed issue done, open stays sent, a
  closed answer is not read again), store (awaiting list, first closure kept, check refuses an unsent answer).
- No non-English text outside `context/`; CHANGELOG entry added.
