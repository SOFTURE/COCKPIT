# Plan: broadcast-row-inset-e2e-polls

## Approach
Replace the one-shot `Promise.all([boundingBox(), boundingBox()])` and its null throw with `expect(...).toPass()`
around reading both boxes and asserting the same inset rule, so the check retries until the row has a stable layout.

## Key decisions
- `toPass` rather than `expect.poll`: the check compares two boxes, so the whole block retries together.

## Phase 1: The inset check polls

- Files: `e2e/broadcast.spec.ts`.
- Mode: test-after (a timing race that a single local run cannot force).
- Done when: the broadcast spec passes locally three times in a row with 4 workers alongside the routines spec;
  gates green; PR CI green; master CI on the merge green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: The inset check polls

#### Automated
- [x] 1.1 The inset check reads both boxes inside `expect(...).toPass()`, same assertions — b4986ad
- [x] 1.2 Broadcast and routines e2e pass 3 runs in a row with 4 workers (broadcast, routines, header-refresh: 8/8 each run); typecheck, lint, doctor green — b4986ad
