---
change_id: row-actions-menu-everywhere
title: "Every list row with several controls uses the shared row menu"
status: new
roadmap_item: CT-23
branch: null
created: 2026-11-25
updated: 2026-11-25
---

## Intent
Every list row in COCKPIT with more than one control shows at most one inline control (the one the row is mostly used for) and the rest in CT-22's `RowActionsMenu`; today that is the Broadcast detail's project rows (Issue link, Retry fire, Retry send); a row with a single action keeps it inline.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-23: Every row with several controls uses the row menu
- **Change ID:** `row-actions-menu-everywhere`
- **Status:** ready
- **Outcome:** every list row in COCKPIT with more than one control shows at most one inline control (the one the row
  is mostly used for) and the rest in CT-22's `RowActionsMenu`; today that is the Broadcast detail's project rows
  (Issue link, Retry fire, Retry send); a row with a single action keeps it inline.
- **Prerequisites:** CT-22
- **Touches (estimate):** `app/(app)/broadcast/[id]/page.tsx`, `src/broadcast/**`, `src/routines/wake-chip.tsx`
  (`RetryWakeForm` started from a menu item, read-only use of CT-22's pattern), the Broadcast e2e spec.
- **Size:** S
- **Unknowns:**
  - Which control stays inline on a Broadcast project row: recommended Retry send when the send failed, otherwise
    the Issue link. (owner: research; blocks: no)
- **Risk:** `wake-chip.tsx` is also used by the inbox (CT-24's lane): only CT-23 edits it; CT-24 reads it.
- **Baseline:** today a Broadcast project row can show three loose buttons; after: a grep of `actions={[` with more
  than one control outside `RowActionsMenu` finds none, and the Broadcast e2e passes at 1280 and 390 px.
- **PRD refs:** F-2
- **Input:** context/changes/row-actions-menu-everywhere/change.md

Findings gathered while recording it:
- Builds on CT-22's `RowActionsMenu` and the rule in `src/shell/list-row.tsx`: at most one inline control, the rest
  in the menu; one action stays inline.
- Code survey (master 064a5ee) of every `ListRow` `actions` slot:
  - `app/(app)/broadcast/[id]/page.tsx`: up to three controls per project row: the Issue link button, `RetryWakeForm`
    (when the fire can be retried) and the Retry send form (failed or sending);
  - single action, stays inline: Settings' watched repositories and Team members (`ConfirmDeleteButton`), Broadcast
    history (delete), Recent fires (`RetryWakeForm`);
  - the inbox and held packages put text, not controls, in the slot: CT-24 owns those.

## Constraints
- Owns exclusively: `app/(app)/broadcast/[id]/page.tsx`, `src/broadcast/**`, `src/routines/wake-chip.tsx`; reads `src/shell/row-actions-menu.tsx`.
- Notion design primitives (`DropdownMenu`, `Button`, `Badge`, `Status`); design tokens only, no raw colours.
- User-visible text, `aria-label` included, through `messages/en.ts` and `messages/pl.ts`.
- On a phone the right column wraps under the identity; controls at least 44 px.
- Existing `data-*` selectors stay, so the e2e specs keep reading the rows.
- No migration. No release, tag, publish or deploy.
- Every CI job green before the merge; master CI checked green after it.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
