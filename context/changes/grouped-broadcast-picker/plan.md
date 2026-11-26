# Plan: grouped-broadcast-picker

## Approach
The page loads the project groups with the repositories and passes the sections from `groupProjects` to the form. The
form keeps one `Set` of picked keys as today; the "Projects" field keeps its legend, hint, Pick all / Clear all and the
total count, and renders one theme `FieldSet` per section (16 px apart). Each section's legend holds the theme
`Checkbox` labelled with the group's name (checked, indeterminate or clear) and a muted "x of y"; under it the grid of
today. The picking rules are pure functions with unit tests; the form only calls them.

## Key decisions (auto)
- D1: New `src/broadcast/project-picks.ts`: `getGroupPickState(keys, picked)` → `all | some | none`,
  `setPicked(picked, keys, isPicked)` → a new set (one project, a group or every project), `countPicked(keys, picked)`.
  The form's state file stays the action's result type.
- D2: `BroadcastForm` takes `sections: ProjectGroupSection<BroadcastFormProject>[]` instead of `projects`; the total is
  every project of every section.
- D3: New keys in the `broadcast` block of both dictionaries: `projectsNoGroup` ("No group") and `groupPickedCount`
  ("{picked} of {total}"). The group checkbox's name is the group's name; the inner fieldset is named by it too.
- D4: The indeterminate look is the theme's; the missing minus sign is filed in SOFTURE/AI, no local override.
- D5: e2e: new `e2e/grouped-broadcast-picker.spec.ts` with fixtures `GROUPED_PICKER_REPOSITORIES` (fake forge serves
  them, labelled cockpit); the evidence capture runs before the assertions so the same spec on master gives "before".

## Phase 1: Grouped picker (TDD)
- `tests/broadcast/project-picks.test.ts`: group select/clear touches that group only, tri-state all/some/none (and an
  empty group), totals across groups, a single toggle.
- `tests/broadcast/broadcast-form-markup.test.tsx` (static markup): fieldsets in section order, No group last, group
  checkbox `aria-checked` true at first, per-group count, each project's label kept.
- `src/broadcast/project-picks.ts`, `src/broadcast/broadcast-form.tsx`, `app/(app)/broadcast/page.tsx`,
  `messages/en.ts`, `messages/pl.ts`.
- Done when: the tests and the gates (typecheck, lint, test) are green.

## Phase 2: e2e and evidence
- `e2e/grouped-broadcast-picker.spec.ts` at 1280 and 390: groups in order with their projects, the group checkbox
  selects and clears its group only, a partly picked group is mixed, Pick all / Clear all cover every group, sending
  creates issues only in the picked projects, 44 px rows on a phone and no sideways scroll; `e2e/broadcast.spec.ts`
  still green.
- Screenshots of the picker (all picked, one group cleared, one group partly picked) at 1280 and 390, light and dark,
  before (master) and after, looked at.
- Done when: the new spec passes three runs in a row, the full e2e is green locally, screenshots looked at.

## Merge
Every CI job green before the merge; master CI read on the merge commit after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Grouped picker

#### Automated
- [ ] 1.1 Picking rules and form markup tests: group select/clear, tri-state, totals, sections in order
- [ ] 1.2 Gates green: typecheck, lint, test

### Phase 2: e2e and evidence

#### Automated
- [ ] 2.1 New spec green three runs in a row; broadcast spec and the full e2e green locally
- [ ] 2.2 Screenshots before and after (picker × 3 states × 1280/390 × light/dark) saved and looked at
