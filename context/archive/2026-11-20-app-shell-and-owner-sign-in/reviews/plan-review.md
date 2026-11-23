# Plan review: app-shell-and-owner-sign-in

Reviewed: plan.md @ 2026-11-23. Mode: full. Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.
Grounding: every package export the plan names exists in the installed versions (auth 0.2.21, db 0.1.17, ops 0.2.6,
security 0.2.12, theme-notion 0.30.0, config 0.1.7, testing 0.5.2).

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS: sign-in, closed registration, shell, empty inbox, gates, CI with `context-doctor` |
| Slicing | PASS: each phase leaves a working, gated tree |
| Verifiability | PASS after W1 |
| Data and migrations | PASS: module migrations only (security, auth); no app table yet |
| Tests | PASS: config test, navigation test, e2e for FR-1 |
| Security | PASS: guard plus `requireUser`; unidentified clients refused unless a test stack opts in |
| Lean | PASS |
| Fit | PASS: follows the SOFTURE example app |
| Scope | PASS |
| Reuse | PASS: no local auth, health or theme code |
| Lessons | PASS (none recorded) |
| Progress format | PASS |

## Findings
- W1 (warning): FR-1 says a visitor without a session gets the sign-in page "or 401 for an endpoint". The plan checks
  pages only. Decision (auto): accepted; the e2e also checks that an unknown API path without a session does not
  answer project data (the guard redirects it), and every later API route checks `requireUser` itself.
- S1 (suggestion): NFR-4 (WCAG 2.2 AA) has no check yet. Decision (auto): the theme's contrast is guarded by its own
  suite; the e2e adds an axe check once a screen holds data (CMP-4), recorded there.

## Decisions (auto)
- Plan accepted with W1 folded into item 2.1.
