# Implementation review: digest-release-ready

Reviewed the diff 47fad4c..5d04975 against plan.md, change.md, the roadmap (CMP-12, CMP-13) and AGENTS.md.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | SUGGESTION | The service-block helper in the stack test keeps the comment lines that precede the next service. | Accept: the assertions anchor on `\n      NAME: ${NAME:-…}\n`, which a comment never matches. |
| 2 | SUGGESTION | `MAILING_UNSUBSCRIBE_SECRET_PREVIOUS` is not set in the dry run. | Accept: it is used only while a secret rotates; the stack test proves it is passed to both services. |
| 3 | SUGGESTION | The secret's 32-character minimum is not enforced at release time (`secret-min-lengths` is an input of the reusable workflow, not of the deploy action this caller uses). | Accept: the mailing package treats a short secret as missing and logs the name; README states the minimum. |

Drift from plan: none. Tests: dropping `DIGEST_RECIPIENTS` from the worker turns the stack test red (mutation
checked); the required-name test is unchanged, so a release without the digest settings still renders (`env render`
wrote 6 names, 0 of 17 optional set). Security: no secret, address or host committed; secrets reach the deploy step
by name only.

Verdict: ready.
