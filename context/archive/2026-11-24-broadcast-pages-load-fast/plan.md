# Plan: broadcast-pages-load-fast

## Approach
1. **No prefetch.** One `AppLink` (`src/shell/app-link.tsx`): `next/link` with `prefetch={false}`; every link in the
   app uses it, so a page view renders one layout, not forty. An e2e spec counts the prefetch requests of a page view.
2. **No app-wide loading state.** A `loading.tsx` for the app group was tried and dropped: its Suspense boundary
   turns `notFound()` into a 200 and a server `redirect()` into a late client-side one (three e2e specs caught it).
3. **Parallel sends.** `sendBroadcast` sends to at most 4 projects at a time (`SEND_CONCURRENCY`); results keep the
   picked order; a storage failure still fails the broadcast.
4. **Spacing.** The history rows and the project rows of one broadcast follow the queued-roadmap row pattern
   (`-mx-2 rounded-md px-2 py-2.5`, `divide-y` without the extra top border).

## Key decisions
- Turn prefetch off everywhere, not only on Broadcast: every screen pays the same cost.
- A bound of 4 rather than all at once: enough to cut a 13-project send to a few seconds.

## Phase 1: Fast pages, parallel sends, spacing
- Files: `src/shell/app-link.tsx`, the nine link files, `src/broadcast/send-broadcast.ts`,
  `app/(app)/broadcast/page.tsx`, `app/(app)/broadcast/[id]/page.tsx`, `tests/broadcast/send-broadcast.test.ts`,
  `e2e/no-prefetch.spec.ts`, `CHANGELOG.md`.
- Mode: TDD (the concurrency test and the prefetch spec fail first).
- Done when: the tests are red before and green after; gates and e2e green; before/after screenshots at 1280 and 390,
  light and dark, show the rows on the grid; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Fast pages, parallel sends, spacing

#### Automated
- [x] 1.1 Concurrency test red with the serial loop (most in flight 1, expected 4), green with the bounded sends — f275b0b
- [x] 1.2 Prefetch spec red before (20 prefetch requests on a page view of `/broadcast`), green after (none) — f275b0b
- [x] 1.3 Gates green: typecheck, lint, test 603/603 — f275b0b
- [x] 1.4 e2e green 71/71 after dropping the app-wide `loading.tsx` (with it: 3 red, 404 → 200 and a late client redirect)
- [x] 1.5 Screenshots before/after (1280/390, light/dark) of the history and one broadcast checked: project files cockpit/evidence/broadcast-pages-load-fast/01-history-{before,after}-{1280,390}-{light,dark}.webp, 02-detail-…
