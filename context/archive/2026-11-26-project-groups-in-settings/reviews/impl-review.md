# Implementation review: project-groups-in-settings

Verdict: approve (auto). The diff matches the plan: migration 0009 (table, `group_id` with `ON DELETE SET NULL`, the
owner seed, rollback in its header), `modules/projects/groups.ts` with results as values, the default group set inside
the repository insert, the pure `groupProjects`/`sortGroups` in `src/projects/group-projects.ts`, the Settings card
between Watched repositories and Team, and the server actions behind `requireUser()` with zod input.

## Findings
- Warning (accepted, fixed in 1a09f8d): a second "Add" button on Settings made the shared e2e helper `submitRepository`
  and two specs ambiguous; they now press the Add of the Watched repositories card.
- Warning (accepted, fixed in 1a09f8d): an always-present `role="status"` in the new card would have made every
  `page.getByRole("status")` on Settings ambiguous; the card's result line is `aria-live="polite"` without the role.
- Suggestion (accepted, kept): `setProjectGroupAction` ships without a caller; CT-31 wires its dropdown to it. Its
  module function is covered by `tests/projects/groups.test.ts`.
- Suggestion (noted for CT-32): the e2e check "a deleted group's projects show under No group on the Projects page"
  belongs to CT-32, which groups that page (plan D6).
