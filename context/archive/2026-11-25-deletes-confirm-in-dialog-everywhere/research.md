# Research: deletes-confirm-in-dialog-everywhere

## Where it lives
- `src/projects/watched-repository-list.tsx` (server component): each watched repository's `li` ends with a `<form>`
  holding a ghost text button "Remove" that submits `removeRepositoryAction` at once. The action
  (`app/(app)/settings/actions.ts`) deletes the row and revalidates the layout; it does not redirect.
- `src/team/member-list.tsx` (server component): every member but the signed-in admin has an inline `<details>`
  "Remove" disclosure with the question and a destructive "Remove from the team" submit. `removeMemberAction`
  (`app/(app)/settings/team/actions.ts`) redirects to `/settings/team?notice=…`.
- `src/shell/confirm-delete-button.tsx` (CT-14, client): trash-can trigger, `AlertDialog`, hidden `fields`, a
  destructive submit; its copy object already carries the destructive word (`delete`) and the pending word
  (`deleting`), so "Remove" / "Removing…" fit without a new prop. It is used by Broadcast (CT-14) and Routines (CT-12).
- e2e: `e2e/watched-repositories.spec.ts` ("a removed repository leaves the list and the sidebar") clicks
  "Remove example-org/beta-app"; `e2e/team.spec.ts` opens the disclosure by its label and clicks "Remove from the
  team".

## Copy
- `messages/{en,pl}.ts` → `repositories.remove`, `removeLabel` exist; a question, a hint (what stays), the pending
  word and Cancel are new.
- `team.removeQuestion` mixes question and hint; it splits into `removeQuestion` and `removeHint`; `removeConfirm`
  goes (the dialog's button is `remove`), `removing` and `cancel` are new.

## Other destructive controls (audit of origin/master 7fda324)
- Routines Delete and Broadcast Delete already use the shared dialog.
- Account → token Revoke and Team → invitation Revoke are package components (SOFTURE/AI#1469, #1470): out of scope.

## Notes
- Server actions passed to the client component from a server component work as in CT-12 and CT-14; a redirect
  thrown inside the transition navigates as before.
