# Plan review: panel-speaks-polish

Reviewed: plan.md @ 2026-11-23. Mode: light (copy and one setting; no migration, no new write). Verdict: ready.
Findings: 0 critical, 2 warnings, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (screens, module pages, mails, MCP, CLI, `lang`, dates, deploy) |
| Verifiability | PASS (parity, inline-copy scan, e2e text scan, screenshots) |
| Data and migrations | PASS (none) |
| Tests | PASS |
| Security | PASS (no new input beyond an allow-listed setting; MCP untrusted-data markers keep their exact text) |
| Scope | PASS |

## Findings
- Warning: the MCP untrusted-data markers are a protocol, not copy; translating them would change what assistants
  look for. Fix: `pl` keeps them byte for byte; the parity test checks they are equal. Accepted.
- Warning: e2e specs log in with `authMessages.en`; the Polish server needs the Polish auth dictionary for its
  sign-in. Fix: the Polish spec logs in with COCKPIT's `auth-pl` dictionary. Accepted.
- Suggestion: the "no English on screen" scan should ignore repository-provided text and words shared by both
  languages ("COCKPIT", "CI", "MCP"). Fix: compare only `en` texts that differ from their `pl` counterpart and contain a
  space. Accepted.

## Decisions (auto)
- Plan accepted as amended above.
