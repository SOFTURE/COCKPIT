# Research: routine-owner-steps-answered-in-inbox

## What SOFTURE/SKILLS#86 settled (`@softure-ai/skills` 0.36.0, installed)
- The package-update routine records owner work in `context/workflow.json` → `routines.packageUpdates`:
  `hold` entries with `owner` (a bump held for the owner's decision) and `ownerSteps` entries (a merged bump's step,
  such as a new secret, with `confirmed: null` until the owner confirms it) (`routines/package-updates.md` step 5).
- `context_state.py` (`_package_update_entries`) lifts them into `owner_queue` with
  `source: "context/workflow.json#routines.packageUpdates.hold"` (kind `decision`, or `secret` when the text names one)
  and `source: "context/workflow.json#routines.packageUpdates.ownerSteps"` (kind `step`, or `secret`). Entry ids are
  the usual `oq-…` ids. With a live roadmap the step goes under `## Before the next release` instead (already shown).
- The cockpit marker does **not** gain a `done` answer: `answer` stays `yes | no | later` (WORKFLOW §8.6).
  `rules/AGENTS.md` (managed block, Cockpit issues): "`yes` on an `ownerSteps` entry sets `"confirmed": "#N"`; the
  answer to an owner hold goes on its issue, and the next package-update run applies it and removes the hold."

## How COCKPIT works today
- `src/state/state-schema.ts` already accepts these entries (kinds `decision | step | secret`, any `source`), so the
  inbox and the MCP `get_inbox` already list them; nothing in `src/state/**` needs to change.
- Answers: `src/inbox/answer-form.tsx` offers Yes / No / Later for every kind (`ANSWERS`);
  `src/forge/issues.ts` `formatOwnerWordIssue` writes "answers **Yes**" and settle steps that only fit a markdown
  checkbox (`— done: #N`), wrong for a `workflow.json` entry (`confirmed`) or an owner hold (its issue).
- Labels of a recorded answer: `src/inbox/inbox-row.tsx`, `app/(app)/inbox/page.tsx` (history) use `copy.answers`.
- `StoredAnswer` (`modules/projects/answers.ts`) already stores `entryKind`; `InboxAnswer` does not expose it.
- MCP `answer_entry` (`src/mcp/answer-tool.ts`) takes `yes | no | later`; its description does not say what `yes`
  means for a step.

## Conclusion
"Done" is COCKPIT's wording of `yes` for entries that are steps (`step`, `secret`): the button, the confirmation, the
recorded answer and the issue say "Done", while the marker stays `"answer": "yes"` as the contract defines. The issue
tells the project how to settle each source: `ownerSteps` → set `"confirmed": "#N"`; an owner `hold` → the next
package-update run applies the answer and removes the hold; anything else → the existing tick rules. No migration,
no new permission, no skills bump (0.36.0 already pinned).
