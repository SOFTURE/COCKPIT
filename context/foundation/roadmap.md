---
project: "COCKPIT"
roadmap: cockpit-v2
version: 1
status: ready
prd_version: 3
updated: 2026-11-23
---

# Roadmap cockpit-v2: COCKPIT talks to every project at once

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: no (no release word for this roadmap yet)
> - Parallelism: up to 4 at once
> - Owner at the keyboard: none (one owner step per watched repository: the wake-up task, see CV-1)
> - Source: the owner's feedback of 2026-11-23, not a PRD revision (F-1 below); the owner will add more items
> - Start: the owner asked for this roadmap and its first item on 2026-11-23 (translated: "yes, create a new
>   roadmap and write this feature up as a change, commit it to master; I will add more items shortly")

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CV-1** | `broadcast-reaches-every-project` | one message from COCKPIT becomes one owner-word issue in every chosen project, tracked until each project closes it | — | autonomous | ready |

## Order

**Feedback points (no PRD FR yet):**
- F-1 (owner, 2026-11-23, translated): "a feature that sends one common message to all our projects so that
  common updates can be triggered; first idea: a status file from COCKPIT (or an issue made automatically) in each
  repository, plus an API call to each project's routine; open to other ideas". The owner chose option (b) of the
  research in the project thread: an `owner-word` issue per repository, woken by a scheduled task with a GitHub
  issue trigger.

**Optimising for:** simplicity: reuse the one write COCKPIT already makes (an owner-word issue, NFR-7) instead
of a new write path.
**First proof:** CV-1, the first common update (for example "bump `@softure-ai/skills` and run the doctor with
`--fix`") that reaches every project without a hand-pasted prompt.
**Main risk:** projects that do not act on the issue until their next run; the wake-up task per repository is an
owner step outside COCKPIT.
**Depth:** the fan-out and its idempotency; the UI stays on the theme's components.

**Sizes:** relative to each other, never hours or dates (`roadmap.sizes: true`). S: one phase, one surface, no
migration. M: two or three phases, or one migration. L: several phases with a new stack or a package seam and open
unknowns.

### Starting point (codebase, 2026-11-23)
- Owner-word issues: present (`src/forge/issues.ts` `formatOwnerWordIssue`, `src/decisions/answer-entry.ts`
  `answerEntry` with a claim against double sends).
- Watched repositories and the token's repository list: present (`src/projects/**`, `src/forge/repositories.ts`).
- Data: per-module migrations (`modules/projects/migrations/0001…0004`).
- UI: Notion-style shell with inbox, projects and settings (`app/(app)/**`).
- MCP and CLI: present (`src/mcp/**`, `cli/**`); out of this item.

### Lanes
| Lane | Chain | Owns (estimate) | Note |
| --- | --- | --- | --- |
| A | CV-1 | `src/broadcast/**`, `app/(app)/broadcast/**`, `modules/projects/migrations/0005_*`, the broadcast format in `src/forge/issues.ts` | the only lane for now; items added later get their own lanes |

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. Broadcast** | CV-1 | 1 M |

Deferred: waking a project through a scheduled task's API trigger (`POST /v1/claude_code/routines/{id}/fire`,
one token per task) instead of the GitHub issue trigger; Dependabot or Renovate for package bumps. Both are in the
research of the project thread; neither is an item until the owner asks.

## Items

### CV-1: A broadcast reaches every project
- **Change ID:** `broadcast-reaches-every-project`
- **Status:** ready
- **Outcome:** the owner writes one message in COCKPIT (title and body), picks every watched project or some of
  them, and sends it; each chosen project gets exactly one issue labelled `owner-word` whose body carries
  `<!-- cockpit-broadcast: {"id": "<broadcast id>"} -->`; a broadcast page lists the projects with "sent" (issue
  link), "done" (issue closed) or "failed" (reason, retry); sending again or retrying never creates a second issue
  in a project; the README says how a project wakes on such an issue (a scheduled task with a GitHub trigger on
  issues labelled `owner-word`, or its next heartbeat).
- **Prerequisites:** — (owner-word issues exist since CMP-5)
- **Touches (estimate):** `src/broadcast/**`, `app/(app)/broadcast/**`, `src/forge/issues.ts` (a broadcast
  formatter next to `formatOwnerWordIssue`), `modules/projects/migrations/0005_*` (broadcasts and their per-project
  sends), `src/shell/**` (one sidebar entry), `messages/en.ts` (own keys), `README.md` (wake-up section).
- **Size:** M
- **Unknowns:**
  - Can a scheduled task's GitHub issue trigger be limited to the `owner-word` label, or does the task's prompt have
    to stop at once on other issues? (owner: research; blocks: no)
  - Should `@softure-ai/skills` ship a ready wake-up task brief (like `routines/roadmap-heartbeat.md`) so every
    project sets it up the same way? If so, file it in SOFTURE/SKILLS. (owner: research; blocks: no)
  - Does a broadcast issue follow the same "owner-word = one decision" rule, or does SKILLS need a note that a
    broadcast is an order for the whole project? (owner: research; blocks: no)
- **Risk:** the second kind of write toward watched repositories in the same shape as the first; a duplicate
  issue in nine repositories, or any write other than issue creation, would break NFR-7.
- **Baseline:** today a common update is a prompt pasted by hand into each project; after: a test sends one
  broadcast to three fictional projects on the fake forge and finds exactly three issues with the label and the
  marker, sends it again and still finds three, fails one project and retries it, closes one issue and sees
  "done"; a test fails on any other writing request; the page passes the phone check at 390 px.
- **PRD refs:** F-1, NFR-5, NFR-7 (FR-5 issue format reused)
- **Input:** context/changes/broadcast-reaches-every-project/change.md

## Before the next release
Carried from cockpit-v1 (still open when it was archived; the releases up to v2026.11.23-5 are deployed):
- [ ] **CMP-8**: make sure every watched repository has the `owner-word` label (the `@softure-ai/skills` installer creates it)
- [ ] **CMP-8**: run the `release` workflow (it tags, writes the notes and deploys), then create the owner account with `npx softure-deploy run --host=<ssh alias> create-account --email=<owner> --commit` (README, "Deploy")
- [ ] **CMP-12**: in Resend, verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY`, `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`, never changed without moving the old one to `MAILING_UNSUBSCRIBE_SECRET_PREVIOUS`) and `DIGEST_RECIPIENTS` (comma-separated), and the variables `MAIL_FROM` (`COCKPIT <digest@your-verified-domain>`) and optionally `DIGEST_AT` (`HH:MM`, default `08:00`); CMP-13 passes them to the app and the worker (README, "The digest in production")
- [ ] **CMP-12**: after the deploy, check the first digest arrives (the first run only records a baseline; the next change mails) and that its unsubscribe link works
- [ ] owner step: give the word to release the digest slice (version 0.2.0, `CHANGELOG.md`), together with or after the first release (CMP-8); set the digest settings first (CMP-12 above) or it deploys with the digest off (**CMP-13**)
- [ ] **CMP-21** (optional): to show health from observability, set `GRAFANA_URL` and a Grafana service account token that may read alert rules as `GRAFANA_TOKEN` in the `production` environment (CMP-23 passes both to the worker, the one process that scans: `GRAFANA_URL` as a variable, `GRAFANA_TOKEN` as a secret)
- [ ] owner step: give the word to release the teams slice (version 0.6.0, `CHANGELOG.md`), together with or after the first release (CMP-8); after `create-account`, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit` so the owner can invite teammates; with the mail settings of CMP-12 set, invite one address and check the invitation mail arrives and its link creates the account (**CMP-20**)
- [ ] **CMP-18**: create a granular npm access token with read and write access to the `@softure-ai` scope and store it as the secret `NPM_TOKEN` in the `npm` environment of the repository (optionally add yourself as a required reviewer there)
- [ ] owner step: give the word to publish the CLI to npm as `@softure-ai/cockpit` (version in `package.json`, `CHANGELOG.md`), then run the `publish-cli` workflow; this also creates the package on npm (**CMP-18**)

## Owner decisions and checks
- [ ] **CMP-12** (carried from cockpit-v1): the mail provider key and a verified sender domain for the digest.
  Gates the digest's real send.
- [ ] **CV-1**: after CV-1 ships, in each watched repository create a scheduled task with a GitHub trigger on
  issues labelled `owner-word` (needs the Claude GitHub App on the repository), following the README section
  CV-1 adds. Without it a broadcast waits for the project's next run.

## Done

## Decisions (auto)
- Existing roadmap → cockpit-v1 had every row `done` or `done_code`, so it was closed first and archived as
  `foundation/archive/2026-11-23-roadmap.md` (the skill's recommended path).
- Source → the owner's feedback F-1 instead of a PRD revision: one item, and the owner will add more shortly;
  F-1 stays inside NFR-7 (owner-word issues are the only write).
- Prefix → `CV` (cockpit-v2); `CMP` stays with cockpit-v1.
- Option → (b) owner-word issue per repository woken by a GitHub issue trigger, chosen by the owner after the
  research; the API trigger and dependency bots are deferred (see `## Order`).
- Migration → in the `projects` module (`0005`), next to the answers table, because a broadcast send is the same
  kind of record as an answer.
