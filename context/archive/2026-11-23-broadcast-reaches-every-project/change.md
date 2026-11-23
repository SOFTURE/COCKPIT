---
change_id: broadcast-reaches-every-project
title: "A broadcast reaches every project"
status: archived
roadmap_item: CV-1
branch: claude/project-thread-orq3ss
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The owner writes one message in COCKPIT (title and body), picks every watched project or some of them, and sends
it; each chosen project gets exactly one issue labelled `owner-word` whose body carries
`<!-- cockpit-broadcast: {"id": "<broadcast id>"} -->`; a broadcast page lists the projects with "sent" (issue
link), "done" (issue closed) or "failed" (reason, retry); sending again or retrying never creates a second issue
in a project. How the project wakes on the issue is CV-2 (`owner-word-issue-wakes-its-project`).

## Context
Roadmap item (cockpit-v2), quoted:

> ### CV-1: A broadcast reaches every project
> - **Change ID:** `broadcast-reaches-every-project`
> - **Status:** ready
> - **Outcome:** see Intent above.
> - **Prerequisites:** — (owner-word issues exist since CMP-5)
> - **Touches (estimate):** `src/broadcast/**`, `app/(app)/broadcast/**`, `src/forge/issues.ts` (a broadcast
>   formatter next to `formatOwnerWordIssue`), `modules/projects/migrations/0005_*` (broadcasts and their
>   per-project sends), `src/shell/**` (one sidebar entry), `messages/en.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Can a scheduled task's GitHub issue trigger be limited to the `owner-word` label, or does the task's prompt
>     have to stop at once on other issues? (owner: research; blocks: no)
>   - Should `@softure-ai/skills` ship a ready wake-up task brief (like `routines/roadmap-heartbeat.md`) so every
>     project sets it up the same way? If so, file it in SOFTURE/SKILLS. (owner: research; blocks: no)
>   - Does a broadcast issue follow the same "owner-word = one decision" rule, or does SKILLS need a note that a
>     broadcast is an order for the whole project? (owner: research; blocks: no)
> - **Risk:** the second kind of write toward watched repositories in the same shape as the first; a duplicate
>   issue in nine repositories, or any write other than issue creation, would break NFR-7.
> - **Baseline:** today a common update is a prompt pasted by hand into each project; after: a test sends one
>   broadcast to three fictional projects on the fake forge and finds exactly three issues with the label and the
>   marker, sends it again and still finds three, fails one project and retries it, closes one issue and sees
>   "done"; a test fails on any other writing request; the page passes the phone check at 390 px.
> - **PRD refs:** F-1, NFR-5, NFR-7 (FR-5 issue format reused)

Owner input (2026-11-23, translated): "Check whether we can build a feature that sends one common message to all
our projects so that common updates can be triggered. First idea: a status file from COCKPIT (or an issue made
automatically) in each repository in a cockpit.md standard, and an API call to the routines of each project (I
have seen that a trigger on an API call exists). I am open to other ideas." After the research the owner said
(translated): "yes, create a new roadmap and write this feature up as a change".

Research findings gathered for this item (project thread, 2026-11-23):
- Options compared: (a) a committed `cockpit.md` needs Contents write and bypasses pull requests, so it breaks
  NFR-7 and the read-only rule in `AGENTS.md`; (b) an owner-word issue needs no new scope (Issues: read and write is
  already granted, NFR-5) and fits the workflow, since a coordinator acts on open owner-word issues at the start of a
  run and on every report, and closing the issue is the receipt; (c) a scheduled task's API trigger works but
  COCKPIT would hold one token per project and the payload arrives as untrusted text; (d) `repository_dispatch`
  needs Actions write and a model key in every repository; (e) Dependabot or Renovate covers package bumps only.
  Chosen: (b), woken by a GitHub trigger.
- Scheduled tasks (Claude Code, formerly routines) support schedule, API and GitHub triggers; the GitHub trigger
  covers issues "opened, edited, closed, reopened, labeled, assigned" and needs the Claude GitHub App on the
  repository (https://code.claude.com/docs/en/routines). API trigger, for the deferred variant:
  `POST https://api.anthropic.com/v1/claude_code/routines/{trig_id}/fire`, a bearer token per task that can only
  fire that task, optional `text` up to 65,536 characters delivered as untrusted, 30 fires per hour per task and
  100 per hour per account, no idempotency key
  (https://platform.claude.com/docs/en/api/claude-code/routines-fire).
- Code to reuse: `src/forge/issues.ts` (`formatOwnerWordIssue`, `OwnerWordIssueInput`), `src/decisions/answer-entry.ts`
  (`answerEntry` claims a row before the forge call and recovers a stale claim after `STALE_CLAIM_MS`; the same
  pattern prevents a second issue on a resend), `src/forge/repositories.ts` (watched repositories),
  `modules/projects/migrations/0003_create_answers.sql` (the answer record a broadcast send resembles).

## Constraints
- Exclusively owned: `src/broadcast/**`, `app/(app)/broadcast/**`, `modules/projects/migrations/0005_*`, the
  broadcast formatter in `src/forge/issues.ts`.
- The only write toward watched repositories stays issue creation (NFR-7); no new token scope (NFR-5).
- Fixtures and docs use fictional repositories only (`AGENTS.md`, open source).
- No release or deploy without the owner's word.

## Notes
- Frame skipped: the owner chose the approach (option b) after the research in the project thread.
