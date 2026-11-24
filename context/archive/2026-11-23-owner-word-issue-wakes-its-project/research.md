# Research: owner-word-issue-wakes-its-project

## What SOFTURE/SKILLS#81 settled (`@softure-ai/skills` 0.35.0)
- The wake-up task is `routines/owner-word-wake.md`: a scheduled task with a GitHub trigger on issues (opened,
  labeled), a fresh session on every fire, that claims an open `owner-word` issue (`<!-- owner-word-wake: claimed -->`)
  whose author can write to the repository, then hands it to the coordinator or carries it out itself. It never
  releases or deploys. The trigger is not filtered by label: the routine lists open owner-word issues and exits at
  once when there is none (answers the roadmap unknown "can the trigger be filtered").
- The declaration lives in `context/workflow.json` → `autonomy.ownerWordWake`: `"routine"`, `"heartbeat"` or
  `"none"`. Not in `context/state.json` (`context_state.py` does not copy it). The doctor notes an autonomous project
  without the key (`owner-word-wake-undeclared`) and fails on any other value (`owner-word-wake-invalid`).
- The setup brief and the routine prompt are in that file ("Setting it up"); the setup steps link there.

## How COCKPIT works today
- The scan (`src/scan/scan-projects.ts`) reads `context/state.json`, owner-word issues and forge facts per project,
  then runs the optional adapters (`src/adapters/contract.ts`, FR-17) and stores each adapter's result in
  `adapters.reads` (`modules/adapters/reads.ts`): `value`, `absent` or `unknown` with a reason. No migration is
  needed for a new adapter.
- Health (`src/adapters/observability/**`) is the pattern: `*-view.ts` turns the stored read into a view, a chip on
  the overview row (`src/overview/overview-row.tsx`), details on the project page
  (`app/(app)/projects/[owner]/[name]/page.tsx`).
- The broadcast page (`app/(app)/broadcast/[id]/page.tsx`) lists sends from `src/broadcast/load-broadcasts.ts`,
  which reads COCKPIT's tables only; it can read the adapter reads too (no forge call).
- `ForgeClient.getJsonFile` reads a JSON file at a ref (Contents read, already granted, NFR-5). No new write (NFR-7).
- Copy: `messages/en.ts` and `messages/pl.ts` (CV-3), one namespace per feature.

## Decisions (auto)
- A third adapter `wake`, always on, reads `context/workflow.json`: no migration, no new scope, one more GET per
  project per scan (NFR-2 stays far under budget).
- Values: `routine` → "wakes on its own"; `heartbeat` → "wakes while a run works"; `none` or the key missing →
  "waits for its next run". A missing `workflow.json` is `absent` (shows nothing, like other adapters); an invalid
  value or unreadable file is `unknown`.
- The setup link points at the public brief in SOFTURE/SKILLS (`routines/owner-word-wake.md#setting-it-up`); the
  README carries the short steps.
- COCKPIT itself declares `"heartbeat"` now: its routine does not exist yet (a GitHub trigger cannot be created from
  a session's scheduled-task tool, only in claude.ai/code/routines), and declaring `"routine"` before it exists is
  the risk the roadmap names. The owner's setup step flips it to `"routine"`.

## Risks
- A declared but missing routine looks configured (roadmap risk): stated in the hint text; nothing more can be read.
