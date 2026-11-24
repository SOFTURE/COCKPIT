---
change_id: owner-word-issue-wakes-its-project
title: "An owner-word issue wakes its project"
status: plan_reviewed
roadmap_item: CV-2
branch: claude/project-thread-r25pwe
created: 2026-11-23
updated: 2026-11-24
---

## Intent
every owner-word issue COCKPIT creates (a broadcast of CV-1 or an inbox answer of CMP-5) is taken up by its project without a human: the project runs the standard wake-up task that `@softure-ai/skills` ships (a Claude Code scheduled task with a GitHub trigger on issues labelled `owner-word`, SOFTURE/SKILLS#81), which hands the issue to the project's coordinator or carries it as one change; COCKPIT reads each project's declared wake-up (`autonomy.ownerWordWake` or what SKILLS#81 settles on) and shows "wakes on its own" or "waits for its next run" on the overview, the project page and the broadcast page, with a link to the setup steps; the README carries those steps.

## Context
Roadmap item (cockpit-v2), quoted:

> ### CV-2: An owner-word issue wakes its project
> - **Change ID:** `owner-word-issue-wakes-its-project`
> - **Status:** blocked (SOFTURE/SKILLS#81)
> - **Outcome:** every owner-word issue COCKPIT creates (a broadcast of CV-1 or an inbox answer of CMP-5) is taken
>   up by its project without a human: the project runs the standard wake-up task that `@softure-ai/skills` ships
>   (a Claude Code scheduled task with a GitHub trigger on issues labelled `owner-word`, SOFTURE/SKILLS#81), which
>   hands the issue to the project's coordinator or carries it as one change; COCKPIT reads each project's declared
>   wake-up (`autonomy.ownerWordWake` or what SKILLS#81 settles on) and shows "wakes on its own" or "waits for its
>   next run" on the overview, the project page and the broadcast page, with a link to the setup steps; the README
>   carries those steps.
> - **Prerequisites:** CV-1; SOFTURE/SKILLS#81 released in `@softure-ai/skills` and the skills bumped here
> - **Touches (estimate):** `src/wake/**`, `src/state/**` (read the declared wake-up), `src/overview/**` and
>   `src/project-page/**` (one badge each), `app/(app)/broadcast/**` (the column), `messages/en.ts` (own keys),
>   `README.md` (setup section), `package.json` (skills bump).
> - **Size:** S
> - **Unknowns:**
>   - The field name and where it lives (`workflow.json` or `state.json`) is decided in SOFTURE/SKILLS#81 (owner:
>     research; blocks: yes).
>   - Can the GitHub issue trigger be filtered to the `owner-word` label? (owner: research; blocks: no)
> - **Risk:** the wake-up task lives in the owner's account, not in the repository; COCKPIT can only show what the
>   project declares, so a declared but missing task looks configured.
> - **Baseline:** today an owner-word issue waits until someone opens the project; after: a test with three
>   fictional projects declaring routine, heartbeat and nothing shows three different badges; in one real project
>   set up by the owner, a broadcast issue is picked up and closed with a comment without a human step.
> - **PRD refs:** F-2, NFR-7 (no new write)
> - **Input:** context/changes/owner-word-issue-wakes-its-project/change.md

Owner input (2026-11-23, translated), after CV-1 was recorded: "we have to automate this: after the issue an
automation should start that takes it up in that project's thread" and "do we have it in the new roadmap?".

Findings gathered for this item:
- The AGENTS.md block of `@softure-ai/skills` makes a coordinator act on open owner-word issues only at the start
  of a run and on every report ("Owner-word issues", "Start of a run" step 0); an idle project has no session that
  reads them.
- Claude Code scheduled tasks (formerly routines) have a GitHub trigger on issues: "opened, edited, closed,
  reopened, labeled, assigned"; it needs the Claude GitHub App on the repository
  (https://code.claude.com/docs/en/routines). A task belongs to the owner's account, so COCKPIT cannot see it.
- `@softure-ai/skills` already ships one routine brief, `routines/roadmap-heartbeat.md` (SOFTURE/SKILLS#72); the
  wake-up brief, the installer's setup steps and a doctor check of the declared wake-up are filed as
  SOFTURE/SKILLS#81, which this item waits for.
- COCKPIT already reads each project's `context/state.json` in the scan (`src/scan/**`, `src/state/**`) and shows
  per-project badges on the overview (`src/overview/**`) and the project page (`src/project-page/**`).

## Constraints
- Exclusively owned: `src/wake/**`.
- No new write toward watched repositories (NFR-7); COCKPIT only reads the declared wake-up.
- The wake-up task, its brief and its doctor check live in `@softure-ai/skills`, never as a local copy here
  (AGENTS.md, "SOFTURE packages first").
- No release or deploy without the owner's word.
