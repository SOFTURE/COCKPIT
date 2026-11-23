# Research: decision-inbox-across-projects

Input: change.md, roadmap CMP-4, PRD FR-4 (and FR-5, FR-6 for the answered states), NFR-1, NFR-3, NFR-4; the
`@softure-ai/theme-notion` README (Badge, Status, Empty); WORKFLOW §8.6 (owner-word marker). Depth: normal.
Snapshot: CMP-3 branch (2d9cc7e), 2026-11-23.

## Summary
CMP-3 stores, per watched project, the last good `context/state.json` (version 2, with an `id` per owner-queue
entry) and the project's `owner-word` issues in `projects.reads`. The inbox is a read of that table: flatten every
project's `owner_queue`, oldest `since` first, and mark an entry answered when an `owner-word` issue carries its
marker `<!-- owner-word: {"entry": "<id>", ...} -->` (open: sent; closed: done). No new table.

## Current state
- `app/(app)/inbox/page.tsx`: the empty state only; the layout passes `inboxCount={0}`.
- `modules/projects/reads.ts`: `findReads` returns state and issues as stored JSON (`unknown`).

## Findings
- **Entry shape (state schema v2):** `id`, `kind` (word, decision, step, secret), `source`, `item`, `since`
  (`YYYY-MM-DD` or null), `text`.
- **Answered entries (FR-4, FR-6):** WORKFLOW §8.6 defines the body marker; COCKPIT writes it in CMP-5. Reading it
  here keeps the inbox right from the first answer on.
- **Age:** days between `since` and today in the app's time zone; an entry without `since` sorts last and shows no
  age.
- **Secrets (FR-4):** the text is shown as the project wrote it; COCKPIT has no field that asks for a secret.
- **Theme:** `Badge` (`variant="tag"`, palette colors) for the property chips, `Status` for sent and done, `Empty`
  for the empty inbox; touch targets use the `min-h-touch-target` token.

## Unknowns answered
- *Group by project as a view option?* Not in this item: FR-4 makes oldest-first the default and grouping a view
  option, not a requirement; the project chip on every row keeps the project visible.

## Modules (SOFTURE first)
Adopted: theme-notion (Badge, Status, Empty). Built here: the inbox read (COCKPIT-specific). No gap.

## Risks
- NFR-1 (inbox under 1 s for 30 projects and 200 entries): one query of 30 rows and an in-memory sort; measured in a
  test with 200 entries.
