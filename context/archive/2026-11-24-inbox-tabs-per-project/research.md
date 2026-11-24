# Research: inbox-tabs-per-project

Short notes; the change reuses CT-5's pattern.

- `app/(app)/inbox/page.tsx` renders three cards: waiting (non-deferred rows), deferred ("Later", PR #62) and the
  history of answers whose entry has left its queue. Rows come from `loadInbox()` oldest first.
- `src/inbox/inbox-row.tsx` already has `showProject` (false on the project page).
- `src/project-page/project-tabs.ts` + the project page draw `TabBar` (`size="touch"`, `md:h-control-height`) from a
  pure function; the shown tab lives in the address.
- `TabBar` items have no title attribute, so the full repository name is shown in the waiting card's description
  inside a project tab.
- e2e (`inbox.spec.ts`, `answer.spec.ts`, `polish.spec.ts`) open `/inbox` and filter rows by project name: the
  default tab "All" keeps the names, so they keep passing.
