# Plan: scan-refresh-spec-waits-for-render

## Approach
1. `e2e/press-scan-now.ts` waits for Scan now's answer and then for the button to be enabled again: the button is
   disabled from the press until React has rendered the answer, so the page shows the post-press state afterwards.
2. The spec then waits for the page to show no running scan, for the header to say when the projects were last read
   (its one reload has started), and for the network to go quiet; only then it counts, and demands 0 refreshes in 6 s.

## Phase 1: Fix the spec
- Files: `e2e/press-scan-now.ts`, `e2e/header-refresh.spec.ts`.
- Done when: the spec green 15/15 with answers delayed 0, 0.8 and 1.5 s; red on the pre-#130 code; full e2e green with
  default workers and twice with 4 workers.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Fix the spec

#### Automated
- [x] 1.1 Red before the fix with delayed answers (11/12), green after (15/15 at 0, 0.8, 1.5 s)
- [x] 1.2 Still red on the pre-#130 app code (3 refreshes, 2/2)
- [x] 1.3 Full e2e green 89/89: default workers once, 4 workers twice
