# Research: routines-tab-dialogs-and-switch

## Where it lives
- `src/routines/routine-forms.tsx` (client): `AddRoutineForm` (inline grid with a free-text kind, inline hints under
  Trigger and Token, an "Enabled" checkbox), `ReplaceTokenForm` (an inline password field under the row) and
  `TestRoutineForm` (its result line sits under the button and widens its column).
- `src/routines/routines-section.tsx` (server): the Routines `SectionCard`; each row stacks name and kind, the
  trigger/token/last-call line, then Test, Enable/Disable and Delete (an immediate delete, no confirmation), then the
  replace-token form; the add form sits under the list.
- `src/routines/manage-routines.ts`: `addProjectRoutine` accepts any kind matching `/^[a-z][a-z0-9-]{0,39}$/`.
- `app/(app)/routines/actions.ts`: `addRoutineAction` reads `enabled` from the checkbox; `setRoutineEnabledAction`
  and `deleteRoutineAction` are plain form actions (`(formData) => Promise<void>`).
- `modules/projects/routines.ts`: `COCKPIT_ISSUES_KIND`; it imports drizzle, so a client component cannot import it.
- `src/shell/section-card.tsx`: title, count and description on the left, `action` on the right (`CardAction`).
- Copy: `messages/{en,pl}.ts` → `routines.*`. Tests: `tests/routines/manage-routines.test.ts` (a "reports" kind is
  accepted today), `e2e/routines.spec.ts` (adds a routine through the inline form, asserts "last call HTTP 200").

## Reuse
- `src/shell/confirm-delete-button.tsx` (CT-14): trash can → `AlertDialog`, `fields` + plain action. Fits
  `deleteRoutineAction` as is.
- Theme (`@softure-ai/theme-notion`): `Dialog` (`closeLabel`, `closeButtonSize="touch"`), `Select` (`size="touch"`,
  a hidden native select for form posts via `name`), `Switch` (`size="touch"`), `Tooltip` (a `TooltipProvider` is
  already in `app/layout.tsx`), `Status`, `Badge`.
- The draft patch (`cockpit/drafts/visual-fixes-draft.patch`) has the CT-12 files; its `wake-chip.tsx` and broadcast
  parts belong to CT-13/CT-14 and stay out.

## Unknowns answered
- Stored kinds: only `cockpit-issues` was ever offered; a row with another kind falls back to its raw text.
- "a popup by the Routines header" (owner's words, F-11) is the add form: an "Add routine" button in the card
  header's action slot opens it as a dialog. The "?" tooltips go by each input's label; the card keeps its
  description.
