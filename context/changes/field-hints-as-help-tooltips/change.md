---
change_id: field-hints-as-help-tooltips
title: "Field and setting hints as \"?\" tooltips everywhere"
status: new
roadmap_item: CT-17
branch: claude/project-thread-64y7ja
created: 2026-11-25
updated: 2026-11-25
---

## Intent
Every explanatory hint that sits as a grey line under a form field or a setting's title becomes the shared "?"
help tooltip CT-12 builds (`src/shell/field-help.tsx`) beside its label, across the whole app, not only on the
Routines form the owner pointed at.

## Context
The owner (2026-11-25, F-11: "the field hints should be tooltips, a question mark by the field"; 13:27 Warsaw: "every
fix is a standard, applied across the whole app"). Audit of master (8cf56ef), inline hints that explain a field or a
setting:
- Broadcast form: `copy.projectsHint` under the projects legend (`src/broadcast/broadcast-form.tsx`).
- Settings, add a repository: the `FieldDescription` `repository-hint` under the picker
  (`src/projects/add-repository-form.tsx`; its text changes with the list's state: loading, listed, unavailable).
- Settings rows: `SettingsRow`'s `hint` line under each title (password, assistant access, session;
  `src/settings/settings-row.tsx`).
- Deploys: `copy.deploys.secretsHint` under the new-secrets badge (`src/adapters/deploy/deploys-list.tsx`).
- Packages: `noUpdateHint` / `updateUnknownHint` beside the "no update" badge
  (`src/adapters/packages/packages-details.tsx`).
Not hints, and they stay visible text: a card's one-line description (`SectionCard`), results and errors
(`role="status"`), the confirmation line before an irreversible send (`confirmHint` in the broadcast and answer
forms), and status explanations that say what is wrong and how to fix it (watched repository `missingHint`,
`noStateHint`, drift `noticeHint`, health hint, inbox `secretHint`).

## Constraints
- Reuse CT-12's `FieldHelp`; the tooltip is reachable by keyboard and touch and its text stays the accessible
  description of the field (`aria-describedby`).
- Copy keys stay; only where they render changes.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
