# Plan: answer-closure-e2e

## Approach
1. Fake forge: an issue keeps a state (`open`/`closed`) and a closed time; `GET /repos/<o>/<n>/issues/<number>` answers
   it; a test-only `POST /__issues/<o>/<n>/<number>/close` closes it and drops its labels, as an owner who closed the
   issue after removing `cockpit` would.
2. A new fixture repository `example-org/closure-app` with one owner-queue entry.
3. `e2e/answer.spec.ts`: answer the entry (issue #1, sent), close the issue without its label, scan, and the entry's
   row shows "Done" with its issue link; the labelled list no longer holds the issue, so only the read by number can
   have found it.

## Key decisions
- The close endpoint drops the labels on purpose: it is the case #166 fixed; a labelled closed issue was already
  covered by the listed-issues path.

## Phase 1: Closure e2e
- Files: `e2e/fake-forge.ts`, `e2e/answer.spec.ts`.
- Mode: test-after (the behaviour exists; the test must pass on master's code and fail if the scan stops reading by
  number).
- Done when: the new test passes locally against `npm run build`; reverting the scan's read by number makes it fail;
  gates green; PR CI all jobs green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Closure e2e

#### Automated
- [ ] 1.1 Fake forge closes an issue and answers it by number
- [ ] 1.2 Spec: answered entry turns Done after the issue closes without its label
- [ ] 1.3 The test fails with the scan's read by number disabled
- [ ] 1.4 Gates and full e2e green
