# Plan: scan-navigation-spec-counts-requests

## Approach
The spec counts the `/projects` navigation requests (RSC, not prefetches) the click causes and demands at most 3:
the page's answer, the trip for the rest of its data, and one refresh that may ride along with it. The heading must
still appear; its timeout (10 slow answers, 30 s, test timeout 60 s) only bounds a loaded machine.

## Phase 1: Fix the spec
- Files: `e2e/scan-status-navigation.spec.ts`.
- Done when: green 6/6 on the current code with 3 workers; red on the code before PR #130; full e2e green with
  default workers once and with 4 workers twice.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Fix the spec

#### Automated
- [x] 1.1 Green 6/6 on the current code (3 workers) — ebdb752
- [x] 1.2 Red on the code before PR #130 (heading never shows, 3/3) — ebdb752
- [x] 1.3 Full e2e green 89/89: default workers once, 4 workers twice — ebdb752
