# Plan review: project-page-roadmap-and-owner-items

Reviewed against change.md, research.md, the PRD (FR-10, G-3, NFR-5, NFR-7) and the code on master 18683e6.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | A failed read with no last good state (never read well) has nothing to show; the plan names only the "last good data" case. | Fix: the builder returns no sections and the page shows the failure with its reason; tested. |
| 2 | WARNING | The fake forge serves the same state on every read, so the e2e cannot reach "the last read failed". | Fix: a fake repository whose state read is refused after the first read; the spec scans twice. |
| 3 | SUGGESTION | Entry `source` paths could link to the file on the forge. | Applied: the entry keeps the inbox row as is (answer parity); the page's links cover the roadmap files and change folders. |
| 4 | SUGGESTION | `messages/en.ts` is shared with parallel threads. | Applied: one new `projectPage` namespace; only `repositories.projectPlaceholder` is removed. |
| 5 | SUGGESTION | NFR-7: the page must not add a forge write. | Applied: the page reuses `answerEntryAction`; `tests/forge/no-other-writes.test.ts` keeps guarding it. |

Verdict: ready to implement after the fixes above (applied to the plan).
