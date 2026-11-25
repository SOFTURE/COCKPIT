# Plan: field-hints-as-help-tooltips

## Approach
One shared shape: `LabelWithHelp` in `src/shell/field-help.tsx` puts a label (or a badge) and CT-12's `FieldHelp`
side by side; the hint text stays the described element's accessible description. Apply it to the five hints of
change.md and to the three Routines fields, so every "?" in the app comes from the same component.

## Key decisions
- The button name is a `fieldHelpLabel` ("Help: {field}") in each namespace that shows a "?" (routines, broadcast,
  repositories, settings, deploys, packages): copy reaches components per namespace, so this avoids new plumbing.
- Server rows (Settings, Deploys, Packages) use `useId` for the hint id (supported in React 19 server components).
- The deploys hint loses its trailing colon (it no longer introduces the list); keys stay.
- Visible status text, card descriptions, results, errors and the confirmation before a send stay as they are.

## Phase 1: Shared wrapper and the five hints (test-after)
- `src/shell/field-help.tsx`, `src/routines/routine-forms.tsx`, `src/broadcast/broadcast-form.tsx`,
  `src/projects/add-repository-form.tsx`, `src/settings/settings-row.tsx`, `src/adapters/deploy/deploys-list.tsx`,
  `src/adapters/packages/packages-details.tsx`, `messages/{en,pl}.ts`, e2e specs that read the hints, `CHANGELOG.md`.
- Done when: an e2e opens each "?" (broadcast projects, repository, a Settings row, deploy secrets, packages update)
  and reads its text, the described element still names it by `aria-describedby`; screenshots at 1280 and 390, light
  and dark, are looked at; gates green.

## Progress

### Phase 1: Shared wrapper and the five hints
- [x] 1.1 `LabelWithHelp` and the help labels; Routines uses it — 16cfef4
- [x] 1.2 Broadcast projects, repository picker, Settings rows, deploy secrets, packages update as "?" tooltips — 16cfef4
- [x] 1.3 e2e opens each "?" and checks the accessible description (`e2e/field-help.ts`; broadcast, settings, repository-picker, slow-repository-list, deploys, packages, routines: 17/17 passed) — 16cfef4
- [x] 1.4 Evidence screenshots looked at (Settings, Broadcast, Deploys, Packages with the tooltip open; 1280/390, light/dark): `cockpit/evidence/field-hints-as-help-tooltips/0N-<what>-after-<width>-<theme>.webp` — 16cfef4
- [x] 1.5 Gates green: typecheck, lint (language scan), test (vitest 683/683), touched e2e; full suite in CI — 16cfef4
