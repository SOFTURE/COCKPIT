# Plan: routine-owner-steps-answered-in-inbox

## Approach
One pure helper decides the answer's wording per entry kind (`step` and `secret`: `yes` reads "Done"); the answer form,
the inbox row, the history and the issue use it. The issue's settle steps follow the entry's source: a routine
`ownerSteps` entry is settled by `"confirmed": "#N"`, an owner `hold` by the next package-update run. The marker keeps
`yes`. TDD on the helper and the issue; e2e with a fictional project whose state lists a routine owner step.

## Key decisions
- Marker unchanged (`yes | no | later`), as SOFTURE/SKILLS#86 left it; "Done" is wording only.
- "Done" applies to every `step`/`secret` entry, not only the routine's: a step is something to do, so "Done" is the
  right word wherever it comes from (a `## Before the next release` line too). `decision` and `word` keep Yes.
- No / Later stay available for steps (the owner may decline or put one off).
- MCP `answer_entry` keeps its enum; its description says `yes` means done for a step or secret.

## Phase 1: Steps answered "Done", routine sources settled right (TDD)
- `src/inbox/answer-label.ts` (new): `getAnswerLabel(copy, kind, answer)`.
- `src/forge/issues.ts`: wording per kind, settle steps per source.
- `src/inbox/answer-form.tsx`, `src/inbox/inbox-row.tsx`, `app/(app)/inbox/page.tsx`, `src/inbox/build-inbox.ts`
  (`entryKind` on answers and history rows), `messages/en.ts`, `messages/pl.ts` (`answers.done`, MCP description).
- e2e `example-org/routine-app`: an `ownerSteps` secret entry shows in the inbox, "Done" sends one owner-word issue
  with marker `yes` and the `confirmed` instruction; the row shows "Done · issue #1".
- Done when: unit tests, e2e and gates green; screenshots light/dark at 1280 and 390 inspected and stored.

## Progress

### Phase 1: Steps answered "Done", routine sources settled right

#### Automated
- [ ] 1.1 `getAnswerLabel` and `formatOwnerWordIssue` tests red, then green
- [ ] 1.2 Form, row, history and MCP description use the kind's wording
- [ ] 1.3 build-inbox test: a routine `ownerSteps` entry is listed and its answer carries the entry kind
- [ ] 1.4 e2e `routine-app`: Done → one owner-word issue with marker `yes` and the `confirmed` step
- [ ] 1.5 Screenshots light/dark at 1280 and 390 inspected and stored
- [ ] 1.6 Gates green: typecheck, lint (language scan), test, doctor
