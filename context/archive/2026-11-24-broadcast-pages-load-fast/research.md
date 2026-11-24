# Research: broadcast-pages-load-fast

## How it works today
- `app/(app)/layout.tsx` renders on every request: `requireUser`, `loadWatchedRepositories`, `loadInbox`,
  `loadScanProgress`, then `loadOverview` (repositories, reads, forge facts, adapter reads).
- `app/(app)/broadcast/page.tsx` and `[id]/page.tsx` read `loadBroadcasts` / `loadBroadcast`
  (`src/broadcast/load-broadcasts.ts`): broadcasts, sends, reads, adapter reads, all from the database.
- Links: `next/link` in nine files (`src/shell/app-sidebar.tsx`, `src/overview/overview-row.tsx`,
  `src/project-page/project-page-sections.tsx`, `src/inbox/inbox-row.tsx`, `src/adapters/deploy/deploys-list.tsx`,
  `app/(app)/packages/page.tsx`, `app/(app)/settings/page.tsx`, `app/(app)/inbox/page.tsx`,
  `app/(app)/broadcast/page.tsx`), all with the default prefetch. No route has a `loading.tsx`.
- `src/broadcast/send-broadcast.ts` → `sendBroadcast` awaits `sendToProject` per project in a `for` loop.

## Measurements
- Local production build, PGlite, three projects: `/`, `/inbox`, `/projects`, `/settings`, `/broadcast`,
  `/broadcast/<id>` each 30 to 140 ms (5 runs each).
- Local page view of `/broadcast`: 18 RSC prefetch requests (`next-router-prefetch: 1`); the following click on Inbox
  fetched `/inbox` again (no prefetch header).
- Production proxy log: `/broadcast?_rsc`, `/projects?_rsc`, `/inbox?_rsc` started together and cancelled (499)
  after 23 to 27 s.

## Risks
- Without prefetch a click waits for the server render (30 to 140 ms locally); a `loading.tsx` would show a skeleton
  sooner but changes 404 statuses and server redirects (see plan).
- Parallel sends: the forge's secondary limit on content creation; a small bound (4) keeps it well under.
