# Plan review: doctor-status-per-project

Reviewed against change.md, research.md, the PRD (FR-7, FR-8, NFR-2, NFR-5) and the code on master 8c76b32.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The roadmap says "no migration"; the plan adds `overview/0002`. | Accept: a stored fact needs a column; lane A (the other migrations) is finished, so no collision. Recorded under Decisions (auto). |
| 2 | WARNING | The checks API is refused for NFR-5's fine-grained token on private repositories, so "the number of failures" cannot always be shown. | Fix: fallback through Actions jobs for the status, "failing" without a count; file the gap in SOFTURE/SKILLS. |
| 3 | WARNING | Every scan test scripts its forge answers exactly; the new read fails them. | Fix: `scanRoutes` takes a `doctor` answer; `NO_FACTS` includes a missing doctor. |
| 4 | SUGGESTION | A refused doctor read could look like "missing". | Applied: a refusal on both paths is `not_readable`, shown as such, never as missing or OK. |
| 5 | SUGGESTION | `pending` must not make a project broken. | Applied: only `failing` adds the broken reason; tested. |

Verdict: ready to implement after the fixes above (applied to the plan).
