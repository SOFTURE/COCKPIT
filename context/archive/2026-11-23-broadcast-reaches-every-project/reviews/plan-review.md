# Plan review: broadcast-reaches-every-project

Reviewed: plan.md @ 2026-11-23. Mode: standard. Verdict: ready after two accepted fixes.
Findings: 0 critical, 2 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every clause of the outcome has a done-when) |
| Verifiability | PASS (vitest on PGlite and a stateful fake forge; e2e on the fake forge; screenshots) |
| Data and migrations | PASS after W-1 |
| Tests | PASS after W-2 |
| Security | PASS (server actions call `requireUser`; quoted text escapes `<!--`; names stay plain) |
| Scope | PASS (MCP and CLI stay out, as in the roadmap) |

## Findings
- W-1 (warning): a takeover of a failed or stale send must be a conditional `UPDATE` on the row's status and its
  `updated_at`, or two retries at once could both create an issue. Accepted: the store's `takeOverSend` matches both.
- W-2 (warning): e2e specs run in parallel on one database, and the form checks every watched project by default;
  the spec must uncheck projects that are not its own, or it writes issues into other specs' repositories.
  Accepted: the spec unchecks every box but its own three.
- S-1 (suggestion): before creating the issue on a retry, look for an issue that already carries the marker (a
  "failed" send may have been a lost answer). Accepted: every takeover looks first.

## Decisions (auto)
- Plan accepted with W-1, W-2 and S-1 applied in implementation.
