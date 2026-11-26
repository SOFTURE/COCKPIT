# Plan: near-budget-e2e-split

## Approach
Split each flow into serial steps of the same spec (`mode: "serial"` already holds). Each step signs in on the page it
starts from; a step that needs the previous step's data (the broadcast's address) reads a spec-level variable and checks
it first. Every assertion and evidence capture is kept, in the same order.

- `project-page`: watch and read; overview and tabs; Roadmaps tab; Changes tab and back; answer from Waiting.
- `broadcast`: send and rows; fire retry from the menu and created issues; entry rows and the Sent tab.
- `routine-steps`: watch and read; the Done answer and its issue.

## Key decisions
- Steps rather than a longer per-test timeout, as in the two earlier routines splits.

## Phase 1: Split the three flows

- Files: `e2e/project-page.spec.ts`, `e2e/broadcast.spec.ts`, `e2e/routine-steps.spec.ts`.
- Mode: test-after (the evidence is the load pass).
- Done when: the local plain pass and the `--workers=4` pass are green, each new step well under 30 s, gates green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Split the three flows

#### Automated
- [ ] 1.1 The three flows run as serial steps with every original assertion
- [ ] 1.2 Local e2e green in the plain pass and with `--workers=4`; each new step under 30 s
- [ ] 1.3 Gates green: typecheck and lint (pre-commit hook)
