# Plan: issues-labelled-cockpit

## Approach
One module, `src/forge/issue-label.ts`, names the labels (`ISSUE_LABEL = "cockpit"`, `LEGACY_ISSUE_LABEL =
"owner-word"`, `ISSUE_LABELS`) and picks the one to write (`findIssueLabel(client, owner, name)`: the first of
`ISSUE_LABELS` the repository has, `null` for none). The forge client lists both labels and merges them newest first.
Answers and broadcasts write with the picked label. Copy names `cockpit`.

## Key decisions
- Prefer `cockpit`, fall back to `owner-word`, never create a label (NFR-7).
- Two list requests per project per scan: the price of reading old and new issues; pages stay capped.
- Body markers and the "Owner word:" issue titles stay: skills and existing issues depend on them.

## Phase 1: Label cockpit with an owner-word fallback

- Files: `src/forge/issue-label.ts`, `src/forge/client.ts`, `src/forge/issues.ts`, `src/decisions/answer-entry.ts`,
  `src/broadcast/send-broadcast.ts`, `messages/{pl,en}.ts`, `README.md`, `CHANGELOG.md`, tests and fakes listed in
  the research, `e2e/fake-forge.ts`, the answer and broadcast e2e specs.
- Mode: TDD.
- Done when: unit tests show an answer and a broadcast use `cockpit` when present, `owner-word` when only it exists,
  and fail `label_missing` with neither; the client lists both labels merged without duplicates; e2e answer and
  broadcast pass on a production build with the new label; gates and doctor green; PR CI green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Label cockpit with an owner-word fallback

#### Automated
- [ ] 1.1 Unit tests for the label pick and the two-label list red, then green
- [ ] 1.2 Answers and broadcasts write the picked label; copy names `cockpit`; e2e answer and broadcast green on a production build
- [ ] 1.3 Gates green: typecheck, lint (language scan), test, doctor
