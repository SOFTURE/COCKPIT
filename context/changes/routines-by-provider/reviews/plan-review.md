# Plan review: routines-by-provider

Reviewed 2026-11-25 against change.md, research.md and the code on master 7fda324. Mode: autonomous.

## Lenses
Scope against change.md, migration safety, contracts between phases, test coverage, secrets, pattern reuse.

## Findings
1. Warning: dropping `trigger_id` in the same migration loses the column for a rollback. Fix: the migration's
   header gives the rollback that rebuilds `trigger_id` from `settings->>'triggerId'`; the migration test runs that
   rollback first, so it is exercised. Accepted.
2. Warning: change.md says `provider` is "constrained to the known providers", while the baseline needs a fake
   provider stored in a test. Fix: format check in the database, registry check in code; the Claude Code settings
   shape is a database check. Accepted, recorded as a decision.
3. Suggestion: "add and edit dialog": no edit dialog exists; building one is new scope. Fix: provider choice in the
   add dialog only; noted in change.md. Accepted.
4. Suggestion: stored `settings` must be narrowed from `unknown` (AGENTS.md TypeScript rule). Fix: `StoredRoutine.settings`
   is `unknown`, the adapter's `readSettings` narrows it with zod. Accepted.

## Decisions (auto)
- All four fixes applied to plan.md and research.md before implementation.
