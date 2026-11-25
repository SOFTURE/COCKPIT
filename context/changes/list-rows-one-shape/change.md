---
change_id: list-rows-one-shape
title: "One list row: identity left, state badge and actions right, one hover box"
status: new
roadmap_item: CT-18
branch: claude/project-thread-64y7ja
created: 2026-11-25
updated: 2026-11-25
---

## Intent
Build the list row the owner's fixes add up to as one shared component, `src/shell/list-row.tsx`, and a shared
`ResultBadge`, and use them on the Broadcast, Scan status, Settings and Team screens:
- left: what the row is (title, number, date and time, secondary line);
- right column: the state badge on top and the row's actions under it (CT-11's "status above action");
- the state badge says a call's or run's result in one colour language: green done or fired, red failed, orange
  needs attention, grey none or pending, always icon plus word (CT-12's test badge, CT-15's fire badge);
- a row that opens something is one box lit on hover in the shared inset (`ROW_SURFACE_CLASS`, #96);
- trash and other icons inside that box (CT-14).

## Context
The owner (2026-11-25 13:27 Warsaw, translated): "every fix is a standard; we have components, use them across the
whole app, not only where I pointed". CT-11, CT-12, CT-14 and CT-15 each fix one screen; nothing yet makes the row
itself a component, so each list keeps its own layout. Audit of master (8cf56ef):
- Broadcast detail (`app/(app)/broadcast/[id]/page.tsx`): the send state sits next to the name, Issue and Retry as
  loose buttons; the fire line under it (CT-13 changes its text only).
- Broadcast history (`app/(app)/broadcast/page.tsx`): already a lit row (CT-14 adds the trash) — becomes the reference.
- Scan status (`app/(app)/scan-status/page.tsx`): status next to the name, no right column.
- Settings, watched repositories (`src/projects/watched-repository-list.tsx`): access status next to the name.
- Settings → Team (`src/team/member-list.tsx`): admin and "you" tags next to the name.
- Routines tab rows and Recent fires: built by CT-12 and CT-15; they move onto the component here.
- `SendStatus` (`Status`) and the deploy/package/CI badges (`Badge`) use two different primitives and different
  colours for the same meaning.
The project views (overview, inbox, project page, history tab, deploys, packages) follow in CT-19.

## Constraints
- Notion design primitives (`Badge`, `Status`); no raw colours.
- One colour map for results in one place, unit-tested.
- On a phone the right column wraps under the left, 44 px controls.
- No change to what any row says, only where it sits.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
- Split from CT-19 by surface so each thread stays small and the component lands once before the bigger screens.
