# Plan review: deploy-state-adapter

Reviewed against change.md, research.md, the PRD (FR-8, FR-17, NFR-2, NFR-5, NFR-6) and the code on master e139a2f.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The adapter calls the forge for every project, unlike the observability one (gated by env); scan tests script their answers exactly. | Applied: the scan still runs only the adapters it is given; only the job handler adds the deploy adapter, so scan tests are untouched. e2e repositories without a deploy workflow get the fake forge's default 404. |
| 2 | WARNING | A dispatch run's tag is not in the runs API. | Applied: its version comes from the report row with the same run id; without one the page says the version is not known. |
| 3 | WARNING | Multi-environment apps write staging rows too. | Applied: production is taken from rows whose environment is `production` only. |
| 4 | SUGGESTION | The report parser depends on the package's format. | Applied: the fixture is a body written by the package's CLI; unmatched rows are skipped, never fatal. |
| 5 | SUGGESTION | The page section and the health section both edit the project page. | Applied: one self-contained component, one line on the page. |

Verdict: ready to implement after the fixes above (applied to the plan).
