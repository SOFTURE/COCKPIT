# Plan review: adapters-release-ready

Reviewed against change.md, research.md, the roadmap (CMP-21 to CMP-23), AGENTS.md and the code on master f59f416.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The roadmap's owner step for CMP-21 says CMP-23 passes the names to "the app and the worker"; the plan passes them to the worker only. | Fix: the plan rewords the owner step (Decisions (auto)). |
| 2 | WARNING | A test that only checks the worker would not catch the token leaking into the app later. | Fix: the stack test and the dry run assert the app gets neither name. |
| 3 | SUGGESTION | The owner gets no tracked step for this slice's release. | Applied in implementation: an owner step under `## Before the next release`, as CMP-13 and CMP-16. |

Verdict: ready to implement after the fixes above (applied to the plan).
