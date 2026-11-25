# Plan: deletes-confirm-in-dialog-everywhere

## Approach
Use CT-14's `ConfirmDeleteButton` for the two remaining destructive controls in COCKPIT's own code: removing a watched
repository on Settings and removing a member on Settings → Team. Each list row keeps its identity on the left and gets
the trash can on the right inside its box. The dialog names what goes and what stays. No change to the shared
component: its copy object already takes the destructive word ("Remove") and the pending word.

## Key decisions
- No new prop on `ConfirmDeleteButton`: `copy.delete` carries "Remove", `copy.deleting` carries "Removing…".
- `team.removeQuestion` splits into question and hint; `team.removeConfirm` is removed (unused after the change).
- The server actions and their authorization stay as they are.

## Phase 1: Repositories and members through the confirmation dialog (test-after)
- `src/projects/watched-repository-list.tsx`, `src/team/member-list.tsx`, `messages/en.ts`, `messages/pl.ts`,
  `e2e/watched-repositories.spec.ts`, `e2e/team.spec.ts`, `CHANGELOG.md`.
- Done when: the e2e cancels a repository removal (the repository stays) and removes it through the `alertdialog`;
  the team e2e cancels and removes the teammate through the dialog; screenshots at 1280 and 390, light and dark, of the
  repository dialog and the team row are looked at; gates green (typecheck, lint, test, the two e2e specs, doctor).

## Progress

### Phase 1: Repositories and members through the confirmation dialog
- [x] 1.1 Watched repositories: trash can on the right of the row, dialog with what stays — d13fc00
- [x] 1.2 Team members: trash can on the right of the row, dialog instead of the inline disclosure — d13fc00
- [x] 1.3 Copy in both dictionaries (question, hint, removing, cancel) — d13fc00
- [x] 1.4 e2e: cancel keeps, confirm removes (repositories and team): `e2e/watched-repositories.spec.ts` and `e2e/team.spec.ts` 11/11 passed — d13fc00
- [x] 1.5 Evidence screenshots (rows and dialogs, 1280/390, light/dark) looked at: `cockpit/evidence/deletes-confirm-in-dialog-everywhere/01-repositories-after-<width>-<theme>.webp`, `02-repository-confirm-after-…`, `03-team-after-…`, `04-member-confirm-after-…` — d13fc00
- [x] 1.6 Gates green: typecheck, lint (language scan), test (vitest 683/683), build, the two e2e specs; full suite in CI — d13fc00
