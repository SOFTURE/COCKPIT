# Plan: broadcast-count-under-a-growing-list

## Approach
Count the picked projects against the list shown now (`projects.filter(...)`) and use that count for the label and
every disabled state. In the e2e, read counts from the page with patterns instead of a total fixed upfront, and retry
"Pick all" until every shown project is picked (a repository watched in between arrives unpicked).

## Phase 1: Count against the shown list; e2e independent of other specs

- Files: `src/broadcast/broadcast-form.tsx`, `e2e/broadcast.spec.ts`.
- Mode: test-after (the failure is the reproduction: it needs a parallel run).
- Done when: the full e2e suite passes once with the default workers and once with `--workers=4`, as CI runs it;
  gates green; the pull request's CI and then master CI are green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Count against the shown list; e2e independent of other specs

#### Automated
- [x] 1.1 The count, both buttons and the send button use the picked projects of the shown list — 2a837b4
- [x] 1.2 The e2e reads counts from the page and retries pick all while the list grows — 2a837b4
- [x] 1.3 Full e2e green with the default workers and with `--workers=4` (71/71 both, production build); gates green (unit 617/617, doctor OK) — 2a837b4
