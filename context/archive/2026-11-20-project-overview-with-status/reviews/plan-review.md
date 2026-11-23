# Plan review: project-overview-with-status

Reviewed against change.md, research.md, the PRD (FR-7, FR-8, NFR-1, NFR-2) and the code on master 62d8cdb.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The new `getJson` on `ForgeClient` breaks CMP-5's `tests/support/memory-forge.ts` (a `ForgeClient` fake) when both are merged. | Accept risk: the second to merge adds the method to the fake; noted in research (Collisions). |
| 2 | WARNING | Every scan test scripts its forge answers exactly; two new reads per project fail them. | Fix: `scanRoutes` takes `release` and `runs` answers; every scan test passes them. Added to phase 1 files. |
| 3 | WARNING | The migration needs `projects.repositories` first. | Fix: the module declares `dependsOn: { projects: "^0.1.0" }`; FK with `ON DELETE CASCADE`; rollback in the header. |
| 4 | SUGGESTION | The doctor column must not look like a pass before CMP-7. | Applied: it shows "n/a" with the CMP-7 wording, never OK. |
| 5 | SUGGESTION | A project whose runs read is refused (no Actions: read) would silently show "none". | Applied: facts carry a read status; the row shows "not readable" for CI and quality review. |

Verdict: ready to implement after the fixes above (applied to the plan's file lists).
