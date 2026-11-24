# Implementation review: broadcast-pages-load-fast

Scope: full · Date: 2026-11-24 · Gates: typecheck ✓ lint ✓ test ✓ (603/603) e2e ✓

## Verdict
Ready. The slow screens came from prefetching, not from the broadcast queries: a page view rendered the app layout
once per visible link (18 requests with three projects, about 40 with twelve), and the click fetched its page again.
Every link now goes through `AppLink` (no prefetch), a broadcast sends to four projects at a time, and the broadcast rows use the padding of the app's other link rows.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | links, one loop, classes, CHANGELOG |
| Progress honesty | PASS | red runs recorded (concurrency 1 vs 4; 20 prefetch requests vs none) |
| Correctness | PASS | one task per project, claims unchanged; a storage failure still fails the broadcast |
| Tests | PASS | unit test of the bound, e2e of a page view's prefetches |
| Security | PASS | no new route or input |

## Findings
- Fixed during the review: the app-wide `loading.tsx` turned `notFound()` into 200 and `/` → `/inbox` into a late
  client redirect (`project-page`, `team` and `packages` specs red); removed.

## Decisions (auto)
- Prefetch off everywhere rather than only on Broadcast: every screen paid the same cost.
- The form's checkbox rows keep their touch-target height.
