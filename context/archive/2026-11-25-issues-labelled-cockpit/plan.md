# Plan: issues-labelled-cockpit

## Approach
One module, `src/forge/issue-label.ts`, names the labels (`ISSUE_LABEL = "cockpit"`, `LEGACY_ISSUE_LABEL =
"cockpit"`, `ISSUE_LABELS`) and picks the one to write (`findIssueLabel(client, owner, name)`: the first of
`ISSUE_LABELS` the repository has, `null` for none). The forge client lists both labels and merges them newest first.
Answers and broadcasts write with the picked label. Copy names `cockpit`.

## Key decisions
- Prefer `cockpit`, fall back to `cockpit`, never create a label (NFR-7).
- Two list requests per project per scan: the price of reading old and new issues; pages stay capped.
- Body markers and the "Cockpit:" issue titles stay: skills and existing issues depend on them.

## Phase 1: Label cockpit with a cockpit fallback

- Files: `src/forge/issue-label.ts`, `src/forge/client.ts`, `src/forge/issues.ts`, `src/decisions/answer-entry.ts`,
  `src/broadcast/send-broadcast.ts`, `messages/{pl,en}.ts`, `README.md`, `CHANGELOG.md`, tests and fakes listed in
  the research, `e2e/fake-forge.ts`, the answer and broadcast e2e specs.
- Mode: TDD.
- Done when: unit tests show an answer and a broadcast use `cockpit` when present, `cockpit` when only it exists,
  and fail `label_missing` with neither; the client lists both labels merged without duplicates; e2e answer and
  broadcast pass on a production build with the new label; gates and doctor green; PR CI green before the merge.

## Phase 2: Match @softure-ai/skills 0.39.0 as published

- Why: 0.39.0 (SOFTURE/SKILLS#99) went further than this plan assumed: `cockpit` is the only label it reads, the answer
  marker is `<!-- cockpit: … -->` and the wake key is `autonomy.cockpitWake`.
- Files: `src/inbox/cockpit-marker.ts`, `src/forge/issues.ts`, `src/forge/issue-label.ts`,
  `src/decisions/answer-entry.ts`, `src/broadcast/send-broadcast.ts`, `src/adapters/wake/*`, messages, README,
  CHANGELOG, tests and e2e that assert the marker or the key.
- Mode: TDD.
- Done when: an answer writes the marker named after its label (`cockpit` by default), both markers are read, the wake
  adapter reads `cockpitWake` before `ownerWordWake`, copy and setup link name the new key and routine; gates and e2e
  green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Label cockpit with a cockpit fallback

#### Automated
- [x] 1.1 Unit tests for the label pick and the two-label list red, then green (`tests/forge/issue-label.test.ts` failed without the module, 5/5 after; fallback tests in answer-entry and send-broadcast) — c87a1f3
- [x] 1.2 Answers and broadcasts write the picked label; copy names `cockpit`; e2e answer and broadcast green on a production build (71/71 e2e, broadcast covers cockpit, cockpit-only and no label) — c87a1f3
- [x] 1.3 Gates green: typecheck, lint (language scan), test (624/624), doctor — c87a1f3

### Phase 2: Match @softure-ai/skills 0.39.0 as published

#### Automated
- [x] 2.1 Unit tests for the cockpit marker, the marker per label and the cockpitWake key red, then green (3 failed before, 629/629 after) — 579cf10
- [x] 2.2 Marker, wake key, copy, setup link and README follow 0.39.0; e2e green on a production build (71/71) — 579cf10
- [x] 2.3 Gates green: typecheck, lint (language scan), test (629/629), doctor — 579cf10
