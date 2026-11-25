# Implementation review: broadcast-reaches-every-project

Scope: full · Date: 2026-11-23 · Commits: 57656e3, e9e6484, c0cead2 · Gates: typecheck ✓ lint ✓ test ✓ (376) build ✓ e2e ✓ (55)

## Verdict
Ready. One broadcast becomes exactly one `cockpit` issue with the `cockpit-broadcast` marker in each picked
project. A send row is claimed before any forge call (unique per broadcast and project); a failed or stale send is
taken over by a conditional update on its status and time, and every takeover and every lost answer first adopts an
issue that already carries the marker. The tests send to three fictional projects, resend (also twice at once), fail
and retry, adopt a lost answer, take over a stale claim, refuse an unlabelled project, and assert that every write is
`POST .../issues`. The pages pass the 390 px phone check in the e2e; screenshots inspected in both themes.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | one decision reworded (rate limits fail per project, no early stop) |
| Scope | PASS | MCP and CLI untouched; only the roadmap's touched paths plus the nav e2e list |
| Progress honesty | PASS | every item carries its evidence and SHA |
| Correctness | PASS after F-1 | |
| Tests | PASS | |
| Security | PASS | actions call `requireUser`; quoted text escapes `<!--`; ids validated as UUIDs |
| Data | PASS | migration 0005 moves forward and names its rollback; constraints hold status and lengths |

## Findings
- F-1 (warning, fixed in c0cead2): the retry action dropped a refused retry (no token, unknown broadcast) without a
  trace; it now logs the code. The send stays as it was, which the page shows.
- F-2 (suggestion, accepted as is): "done" follows the scan's stored issues, so it shows after the next scan, as in
  the inbox; the page says so.

## Decisions (auto)
- Any signed-in member may broadcast, as any member may answer (FR-16).
- A resubmitted form with edited text keeps the first text: the broadcast id is the form's, and the stored broadcast
  is the one every project receives.
