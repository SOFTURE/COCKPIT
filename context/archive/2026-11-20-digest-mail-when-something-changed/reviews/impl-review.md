# Implementation review: digest-mail-when-something-changed

Reviewed the diff 18683e6..ec43836 against plan.md, change.md, research.md, the PRD (FR-12) and AGENTS.md.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | Phase 1 was planned TDD, but the rule's code was written before its tests (the commit says so). | Accept: the tests assert exact values of every case of the rule (no change, item, release, entry, broken, recovered, new project, answered) and would fail on any change of it; recorded here and in the p1 commit. |
| 2 | WARNING | A recipient address the provider refuses (`rejected`, `invalid_input`) counts as finished, so the digest is marked sent and that address silently misses it. | Accept: the mailing module logs one line per failure; a malformed `DIGEST_RECIPIENTS` is the operator's to fix and blocking the other recipients would be worse. |
| 3 | SUGGESTION | The first scheduled run after a deploy (the e2e shows the schedule fires on start) records the baseline then, not at `DIGEST_AT`. | Accept: the baseline is what "since the last digest" needs; mail still goes only at `DIGEST_AT`. |
| 4 | SUGGESTION | `compose.yaml` does not pass `MAIL_FROM`, `RESEND_API_KEY`, `MAILING_UNSUBSCRIBE_SECRET`, `DIGEST_RECIPIENTS`, `DIGEST_AT` to the app and the worker yet. | Deferred to CMP-13 (lane R owns the release files); recorded under `## Before the next release`. |

Drift from plan: none. The migration lives in `modules/digest/migrations/0001` (per-module numbering), as the plan
decided. Tests: 30 digest tests (rule, snapshot, render with HTML escaping, storage with one pending at most,
settings, the run over a migrated database with a fake provider: baseline, no change, change, quiet, outage retried
with the same text, unsubscribed recipient, schedule and not configured); `e2e/unsubscribe.spec.ts` drives the page
and the one-click route without a session, and refuses a forged link. Security: no secret, address or host
committed; the unsubscribe paths are public by design and verify the signature before any write; repository text
is escaped in the HTML body and kept out of the subject.

Integration: `npm run build && npm run e2e` 21/21 green on the tree of ec43836.

Verdict: ready.
