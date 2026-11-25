# Research: issues-labelled-cockpit

## Where the label lives today
- `src/forge/client.ts`: `ISSUE_LABEL = "cockpit"`; `listOwnerWordIssues` reads
  `issues?labels=cockpit&state=all` (the scan, answer adoption, broadcast adoption); `hasLabel` reads
  `labels/<name>`.
- `src/forge/issues.ts`: both issue builders set `labels: [ISSUE_LABEL]`.
- `src/decisions/answer-entry.ts` and `src/broadcast/send-broadcast.ts`: check `hasLabel(ISSUE_LABEL)`, fail
  with `label_missing` when absent, then `createIssue`.
- Copy: `messages/{pl,en}.ts` (answer confirm hint, `label_missing` for answers and broadcasts, broadcast hints, MCP
  answer tool results). README names the label.
- Tests: `tests/support/memory-forge.ts` (labels set, list filters `cockpit`), `tests/support/fake-forge-routes.ts`
  (exact list URL), `e2e/fake-forge.ts` (list by `labels` param, `/labels/cockpit`), unit and e2e specs that assert
  the label.

## The consumers in watched projects
`@softure-ai/skills` ≤ 0.38 (outside the wake routine) knows only `cockpit`; 0.39.0 (SOFTURE/SKILLS#96) lists both labels and creates
`cockpit`. The GitHub trigger of a wake routine may filter by label (COCKPIT's own does: `cockpit`), so the owner
adds `cockpit` to that filter.

## GitHub behaviour
`issues?labels=a,b` means both labels (AND), so reading two labels takes two lists merged by number. A list for a
label that does not exist answers `200 []`. Creating an issue with a missing label would create the label, which
NFR-7 forbids, so the label check stays.

## Answer
Pick the label per project at write time: `cockpit` when the repository has it, else `cockpit`, else
`label_missing`. A project switches the moment its `cockpit` label exists, which in practice is when skills 0.39
is installed, so its coordinator and routine already read the new label. Read both labels everywhere.
