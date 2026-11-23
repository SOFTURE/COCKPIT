# Plan review: digest-release-ready

Reviewed against change.md, research.md, the roadmap (CMP-12, CMP-13), AGENTS.md and the code on master 47fad4c.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The owner step for CMP-12 says to set every name "in the production environment" without saying which are secrets and which variables; `MAIL_FROM` set as a secret would never reach `.env.prod`. | Fix: the roadmap step and README name the kind of each. |
| 2 | WARNING | A short `MAILING_UNSUBSCRIBE_SECRET` counts as missing and silently turns list mail off. | Fix: README states the 32-character minimum and `openssl rand -base64 32`. |
| 3 | SUGGESTION | `DIGEST_AT` empty in `.env.prod` would fall back to the code default anyway; a compose default documents it. | Applied: `${DIGEST_AT:-08:00}`. |
| 4 | SUGGESTION | The dry run could pass while the worker lacks the names. | Applied: the dry run checks the worker's environment. |

Verdict: ready to implement after the fixes above (applied to the plan).
