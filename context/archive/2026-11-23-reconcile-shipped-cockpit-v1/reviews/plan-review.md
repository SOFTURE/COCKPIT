# Plan review: reconcile-shipped-cockpit-v1

Verdict: approve.

- The plan edits only `context/` and cites forge evidence for every tick (no unverifiable criterion).
- Risk checked: CMP-12's code shipped but the digest is off without the mail settings; the row becomes `done`
  (code released) and the settings stay an open owner step, so nothing that waits is hidden.
- Risk checked: CMP-18 is not published (0 `publish-cli` runs); it stays `done_code`.
- `grant-role` admin cannot be seen from the forge; it stays open rather than ticked on a guess.
