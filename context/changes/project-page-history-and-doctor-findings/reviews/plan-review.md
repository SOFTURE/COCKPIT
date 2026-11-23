# Plan review: project-page-history-and-doctor-findings

Reviewed against change.md, research.md, the PRD (FR-11, NFR-2, NFR-3, NFR-7) and the code on master d5dedfd.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The doctor lists at most nine findings; with more, the page would silently show fewer than the run has. | Fix: the block takes the total from the summary annotation and says how many more the run has, with a link to it; tested. |
| 2 | WARNING | A fine-grained token is refused the check-runs API, so for most installs the findings block would only say "refused". | Accept with fix: the reason names the Checks permission and that only a GitHub App holds it, and links the doctor run when the jobs fallback is not used; the overview keeps the doctor status from the scan. |
| 3 | WARNING | Reading on open makes a slow forge hold the page. | Fix: the four reads run in parallel; each failure is its block's reason. |
| 4 | SUGGESTION | NFR-7: the history must not add a write. | Applied: only GET reads; `tests/forge/no-other-writes.test.ts` keeps guarding the client. |
| 5 | SUGGESTION | `messages/en.ts` is shared with parallel threads. | Applied: one new namespace and one key. |

Verdict: ready to implement after the fixes above (applied to the plan).
