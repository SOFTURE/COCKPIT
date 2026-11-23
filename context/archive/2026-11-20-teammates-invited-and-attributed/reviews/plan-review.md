# Plan review: teammates-invited-and-attributed

Reviewed against change.md, research.md, the PRD (FR-16, access control) and the code on master 18683e6.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | Nothing grants `admin` today, so the invitation actions would be closed to the owner after deploy. | Fix: `grant-role` script and an owner step in the README; the e2e seeds the owner as admin. |
| 2 | WARNING | The console sender refuses in production, so invitations cannot be delivered there before the mailing module. | Accept: recorded as a handoff for CMP-20 (or switched here if CMP-12 is merged first); no local mail workaround (AGENTS.md). |
| 3 | WARNING | An owner-word issue can live in a public repository; naming the answerer by email would publish an address. | Fix: display name, else the part before `@`. |
| 4 | SUGGESTION | The e2e cannot read a console-printed invitation link. | Applied: acceptance and refused tokens are covered by vitest against the server functions; the e2e seeds the teammate account. |
| 5 | SUGGESTION | Removing yourself would lock the owner out. | Applied: `removeMember` refuses the signed-in account; tested. |
| 6 | SUGGESTION | A new required `answerEntry` input breaks a parallel caller (CMP-14). | Accept: a compile error at merge is the right signal; noted in research. |

Verdict: ready to implement after the fixes above (applied to the plan).
