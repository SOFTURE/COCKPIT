# Research: delete-in-confirm-dialog

## Where it lives
- `src/broadcast/delete-broadcast-button.tsx` (client): a ghost trash-can button that swaps itself for an inline
  `<form>` with the question, the hint, Delete and Cancel. That form squeezes the row (owner's evidence
  `02-delete-confirm-before-970-dark.webp`).
- `app/(app)/broadcast/page.tsx`: each history `li` is a flex row holding the `AppLink` (with `ROW_SURFACE_CLASS`,
  lit on hover) and, beside it, the delete button; the button therefore stands outside the lit box
  (`01-history-row-before-3194-dark.webp`).
- `e2e/broadcast.spec.ts` ("a sent broadcast is deleted from the list only after its confirm…") asserts the inline
  confirm text inside the row.
- Copy: `messages/{en,pl}.ts` → `broadcast.delete`, `deleteLabel`, `deleteQuestion`, `deleteHint`, `deleting`,
  `cancel` already exist; no new strings are needed.

## Reuse
- `src/roadmap/promote-form.tsx` already uses the theme's `AlertDialog` (`@softure-ai/theme-notion`) with a
  controlled `open`, a form inside `AlertDialogContent`, `AlertDialogCancel size="touch"` and the 44 px / md 28 px
  control size. The new shared button follows the same pattern.
- The draft patch in the project files (`cockpit/drafts/visual-fixes-draft.patch`) carries a
  `src/shell/confirm-delete-button.tsx` and the page change; used as input.

## Risks
- A button inside an `<a>` is invalid; the trash can stays a sibling of the link, positioned absolutely over the
  link's right padding, and the `li` lights the link on hover of either (`[&:hover>a]:bg-accent`).
