# Implementation review: teammates-invited-and-attributed

Reviewed the branch against plan.md, change.md, the PRD (FR-16, access control) and AGENTS.md, after merging master
(CMP-9, which reuses `InboxRow`, so the project page names the answerer too).

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | `answered_by_name` keeps a removed teammate's email in the answer history (personal data after the account is gone). | Accept: FR-16 asks the history to name who answered; the issue carries only the part before `@`. Revisit with a privacy contributor if COCKPIT adds data export. |
| 2 | WARNING | Migration `projects/0004` reads `auth.users`; without an order the runner migrated `projects` before `auth` in tests. | Fixed: `projects` declares `dependsOn: { auth }`, so auth migrates first everywhere. |
| 3 | WARNING | In production the console sender refuses, so an invitation shows "not sent" until the mailing module exists. | Accept: covered by the e2e as the honest production behaviour; handoff to CMP-20 (or switch when CMP-12 is merged). |
| 4 | SUGGESTION | A "use server" file may export only async functions; the notice parameter lived there first. | Fixed: moved to `src/team/team-notice.ts`. |
| 5 | SUGGESTION | A second browser context in the e2e had no client address and was refused by security. | Fixed: `openPageAsNewClient`. |
| 6 | SUGGESTION | Names in the issue could carry markdown or HTML. | Fixed: stripped to plain text; tested. |

Drift from the plan: the ops script lives in `scripts/ops/grant-role.ts` (the Dockerfile bundles `scripts/ops/*` for
`softure-deploy run`), not `scripts/grant-role.ts`. Progress is honest: every ticked item has a test or evidence.

Verdict: approve.
