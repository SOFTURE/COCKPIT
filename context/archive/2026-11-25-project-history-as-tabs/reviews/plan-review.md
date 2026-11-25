# Plan review: project-history-as-tabs

Reviewed 2026-11-25 against change.md, research.md and the code on master (7fda324).

## Lenses
- Scope vs change.md: matches (history tabs, shared helper, project page, inbox, Broadcast, Team).
- Contracts: auth redirects with `?notice=` would land on a hidden tab; the plan defaults Team to Invite then.
- Tests: unit tests for the pure pieces; e2e follows each changed screen; Polish copy covered by `polish.spec.ts`.
- Migrations, dependencies: none.
- Parallel work: CT-16/CT-18/CT-19 touch Broadcast, Team and the history rows later; they wait for CT-21.

## Findings
1. (Warning) "Each tab reads only its block" cannot hold with counts on every tab: counts need every block. Fix: read all
   blocks once (as today) and keep a failure inside its own tab. Accepted, recorded in Key decisions.
2. (Suggestion) Keep e2e region names stable where possible ("Recent merges", "Releases", "Doctor findings") so later
   items' specs do not churn. Accepted.

## Decisions (auto)
- Both findings accepted as written; no open question for the owner.
