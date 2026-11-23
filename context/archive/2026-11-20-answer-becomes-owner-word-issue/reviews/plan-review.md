# Plan review: answer-becomes-owner-word-issue

Reviewed: plan.md @ 2026-11-23. Mode: full. Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.
Grounding: `requestJson` write methods (core), `requireUser` (auth), `Textarea`, `Button`, `Status` (theme-notion),
`buildInbox`, `listOwnerWordIssues` (CMP-3, CMP-4) exist.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS: answer, confirm, one issue, sent, done, changed since, outside issues, history, failures |
| Slicing | PASS: rule first, screen second |
| Verifiability | PASS |
| Data and migrations | PASS: one forward migration with its rollback; the unique index is the double-answer guard |
| Tests | PASS: concurrent answers, failure kinds, no other writes |
| Security | PASS: requireUser on the action; fixed failure messages; no person in public issues |
| Lean | PASS |
| Fit | PASS: module query pattern, forge client, theme components |
| Scope | PASS |
| Reuse | PASS: the rule sits in `src/decisions/` for CMP-15 |
| Lessons | PASS (none recorded) |
| Progress format | PASS |

## Findings
- W1 (warning): a `creating` claim released after a timeout could drop an issue the forge did create. Decision
  (auto): accepted fix already in the plan, the timeout path re-reads the owner-word issues and adopts the one with
  the marker before releasing.
- S1 (suggestion): the action could post the entry text instead of re-reading it. Decision (auto): the action sends
  the text it showed and the rule compares it with the stored state, so an answer never lands on text the owner did
  not see.

## Decisions (auto)
- Plan accepted.
