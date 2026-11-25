# Plan: field-hints-as-help-tooltips

## Approach
One shared shape: `LabelWithHelp` in `src/shell/field-help.tsx` puts a label (or a badge) and CT-12's `FieldHelp`
side by side; the hint text stays the described element's accessible description. Apply it to the five hints of
change.md and to the three Routines fields, so every "?" in the app comes from the same component.

## Key decisions
- The button name is one app-wide message `shell.fieldHelpLabel` ("Help: {field}"); the routines key is dropped.
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
- [ ] 1.1 `LabelWithHelp` and the app-wide help label; Routines uses it
- [ ] 1.2 Broadcast projects, repository picker, Settings rows, deploy secrets, packages update as "?" tooltips
- [ ] 1.3 e2e opens each "?" and checks `aria-describedby`
- [ ] 1.4 Evidence screenshots looked at
- [ ] 1.5 Gates green: typecheck, lint, test, touched e2e; full suite in CI
