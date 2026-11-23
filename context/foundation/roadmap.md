---
project: "COCKPIT"
roadmap: cockpit-v2
version: 2
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
> - Owner at the keyboard: none (one owner step per watched repository: the wake-up task, see CV-2)
> - Source: the owner's feedback of 2026-11-23, not a PRD revision (F-1 below); the owner will add more items
> - Start: the owner asked for this roadmap and its first item on 2026-11-23 (translated: "yes, create a new
>   roadmap and write this feature up as a change, commit it to master; I will add more items shortly")

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CV-1** | `broadcast-reaches-every-project` | one message from COCKPIT becomes one owner-word issue in every chosen project, tracked until each project closes it | — | autonomous | done_code (waiting: release) |
| **CV-2** | `owner-word-issue-wakes-its-project` | every owner-word issue (a broadcast or an inbox answer) starts its project's wake-up task by itself; COCKPIT shows which projects wake on their own | CV-1 | autonomous | blocked (SOFTURE/SKILLS#81) |
| **CV-3** | `panel-speaks-polish` | the whole COCKPIT panel, its mail and its MCP and CLI labels read in Polish when the app's locale is `pl` | — | autonomous | ready |
| **CV-4** | `screens-share-one-full-width-layout` | Settings opens fast and every screen, Settings included, uses the same full-width page layout | — | autonomous | done_code (waiting: release) |

## Order

**Feedback points (no PRD FR yet):**
- F-1 (owner, 2026-11-23, translated): "a feature that sends one common message to all our projects so that
  common updates can be triggered; first idea: a status file from COCKPIT (or an issue made automatically) in each
  repository, plus an API call to each project's routine; open to other ideas". The owner chose option (b) of the
  research in the project thread: an `owner-word` issue per repository, woken by a scheduled task with a GitHub
  issue trigger.

- F-2 (owner, 2026-11-23, translated): "we have to automate this: after the issue an automation should start
  that takes it up in that project's thread".
- F-3 (owner, 2026-11-23, translated): "add to the current roadmap that the whole panel is in Polish".
- F-4 (owner, 2026-11-23, translated): "optimise the Settings tab: first, it is slow; second, it should be 100%
  wide like the other screens; do the same for the rest of the screens in the project, everything in one standard".

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
| A | CV-1 → CV-2 | `src/broadcast/**`, `src/wake/**`, `app/(app)/broadcast/**`, `modules/projects/migrations/0005_*`, the broadcast format in `src/forge/issues.ts` | the broadcast and its wake-up |
| B | CV-3 | `messages/pl.ts`, `messages/index.ts`, `softure.config.ts` (`locale`), `app/layout.tsx` (`lang`), `src/projects/format-time.ts` | parallel with lane A: no migration; `messages/en.ts` is shared, so each item adds only its own keys and CV-3 translates whatever keys exist on the main branch when it merges |
| C | CV-4 | `app/(app)/settings/**`, `src/projects/load-repository-suggestions.ts`, `src/forge/repositories.ts`, `src/shell/page-layout.tsx` (new), the page wrappers of `app/(app)/**` | after or before CV-3, never at the same time: both touch the settings page's copy and layout; no migration |

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. Broadcast that runs by itself** | CV-1, CV-2 | 1 S, 1 M |
| 2. Polish panel | CV-3 | 1 M |
| 3. One layout, fast Settings | CV-4 | 1 M |

Deferred: waking a project through a scheduled task's API trigger (`POST /v1/claude_code/routines/{id}/fire`,
one token per task) instead of the GitHub issue trigger; Dependabot or Renovate for package bumps. Both are in the
research of the project thread; neither is an item until the owner asks.

## Items

### CV-1: A broadcast reaches every project
- **Change ID:** `broadcast-reaches-every-project`
- **Status:** done_code (waiting: release)
- **Outcome:** the owner writes one message in COCKPIT (title and body), picks every watched project or some of
  them, and sends it; each chosen project gets exactly one issue labelled `owner-word` whose body carries
  `<!-- cockpit-broadcast: {"id": "<broadcast id>"} -->`; a broadcast page lists the projects with "sent" (issue
  link), "done" (issue closed) or "failed" (reason, retry); sending again or retrying never creates a second issue
  in a project. How the project wakes on the issue is CV-2.
- **Prerequisites:** — (owner-word issues exist since CMP-5)
- **Touches (estimate):** `src/broadcast/**`, `app/(app)/broadcast/**`, `src/forge/issues.ts` (a broadcast
  formatter next to `formatOwnerWordIssue`), `modules/projects/migrations/0005_*` (broadcasts and their per-project
  sends), `src/shell/**` (one sidebar entry), `messages/en.ts` (own keys).
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
- **Input:** context/archive/2026-11-23-broadcast-reaches-every-project/change.md

### CV-2: An owner-word issue wakes its project
- **Change ID:** `owner-word-issue-wakes-its-project`
- **Status:** blocked (SOFTURE/SKILLS#81)
- **Outcome:** every owner-word issue COCKPIT creates (a broadcast of CV-1 or an inbox answer of CMP-5) is taken
  up by its project without a human: the project runs the standard wake-up task that `@softure-ai/skills` ships
  (a Claude Code scheduled task with a GitHub trigger on issues labelled `owner-word`, SOFTURE/SKILLS#81), which
  hands the issue to the project's coordinator or carries it as one change; COCKPIT reads each project's declared
  wake-up (`autonomy.ownerWordWake` or what SKILLS#81 settles on) and shows "wakes on its own" or "waits for its
  next run" on the overview, the project page and the broadcast page, with a link to the setup steps; the README
  carries those steps.
- **Prerequisites:** CV-1; SOFTURE/SKILLS#81 released in `@softure-ai/skills` and the skills bumped here
- **Touches (estimate):** `src/wake/**`, `src/state/**` (read the declared wake-up), `src/overview/**` and
  `src/project-page/**` (one badge each), `app/(app)/broadcast/**` (the column), `messages/en.ts` (own keys),
  `README.md` (setup section), `package.json` (skills bump).
- **Size:** S
- **Unknowns:**
  - The field name and where it lives (`workflow.json` or `state.json`) is decided in SOFTURE/SKILLS#81 (owner:
    research; blocks: yes).
  - Can the GitHub issue trigger be filtered to the `owner-word` label? (owner: research; blocks: no)
- **Risk:** the wake-up task lives in the owner's account, not in the repository; COCKPIT can only show what the
  project declares, so a declared but missing task looks configured.
- **Baseline:** today an owner-word issue waits until someone opens the project; after: a test with three
  fictional projects declaring routine, heartbeat and nothing shows three different badges; in one real project
  set up by the owner, a broadcast issue is picked up and closed with a comment without a human step.
- **PRD refs:** F-2, NFR-7 (no new write)
- **Input:** context/changes/owner-word-issue-wakes-its-project/change.md
- **Owner step after it ships:** in each watched repository install the Claude GitHub App and create the wake-up
  scheduled task (GitHub trigger on issues labelled `owner-word`) from the brief `@softure-ai/skills` ships, as the
  README section of CV-2 says; `softure-archive` turns it into an owner entry when CV-2 is archived.

### CV-3: The panel speaks Polish
- **Change ID:** `panel-speaks-polish`
- **Status:** ready
- **Outcome:** with the app's locale set to `pl` (a runtime setting, `en` stays the default for the open-source
  build), every screen of the panel (sign-in, sidebar, inbox, overview, project pages, history, roadmap view,
  broadcast, settings, team), its `aria-label`s, its error messages, the digest mail, the invitation mail and the
  MCP and CLI labels read in Polish; dates and times use Polish formatting; `<html lang>` follows the locale; a test
  fails when `messages/pl.ts` misses a key of `messages/en.ts` or when user-visible text is inline in code.
- **Prerequisites:** — (CV-1 and CV-2 add their own keys to both dictionaries once CV-3 is merged; whichever merges
  second translates the other's keys)
- **Touches (estimate):** `messages/pl.ts` (new), `messages/index.ts`, `softure.config.ts` (`locale` from the
  environment), `app/layout.tsx`, `src/projects/format-time.ts`, components that still hold inline text,
  `compose.yaml` and `.github/workflows/deploy.yml` (the locale variable by name), `README.md` (the setting).
- **Size:** M
- **Unknowns:**
  - Does `@softure-ai/core`'s `Locale` already include `pl`, and do `@softure-ai/auth` and `@softure-ai/theme-notion`
    ship Polish copy for their own screens? A gap any app would hit goes to SOFTURE/AI. (owner: research; blocks: no)
  - Repository text COCKPIT shows as it is (roadmap titles, entry texts, doctor codes) stays in the project's own
    language; only COCKPIT's copy is translated. (owner: research; blocks: no)
- **Risk:** a missed string leaves a mixed-language screen; the key-parity test and an e2e pass in `pl` guard it.
- **Baseline:** today the panel is English only (`messages/en.ts`, 585 lines, `locale: "en"`); after: the e2e
  suite runs once with `pl` and finds no English copy on the inbox, overview and settings screens (screenshots at
  1280 and 390 px, light and dark), the parity test is green, and the default build still renders English.
- **PRD refs:** F-3, NFR-3, NFR-4
- **Input:** context/changes/panel-speaks-polish/change.md
- **Owner step after it ships:** set the locale variable to `pl` in the `production` environment (the README
  section of CV-3 names it); `softure-archive` turns it into an owner entry when CV-3 is archived.

### CV-4: Every screen shares one full-width layout
- **Change ID:** `screens-share-one-full-width-layout`
- **Status:** done_code (waiting: release)
- **Outcome:** Settings opens without waiting for the forge: the list of repositories the token can read is no
  longer fetched page by page on every render but loaded once, kept for a short time and refreshed in the
  background or on demand, so the page shows the watched repositories at once; Settings and every other screen
  (inbox, overview, project pages, history, roadmap view, team, broadcast) use one shared page layout component
  with the full width of the content area, the same header, spacing and card style; a test fails when a page
  under `app/(app)/` does not use the shared layout.
- **Prerequisites:** — (runs before or after CV-3, not alongside it)
- **Touches (estimate):** `app/(app)/settings/page.tsx` and `app/(app)/settings/team/page.tsx` (drop
  `max-w-content-width`), `src/projects/load-repository-suggestions.ts`, `src/forge/repositories.ts`
  (`listReadableRepositories` pages through `/user/repos` sequentially), `src/shell/page-layout.tsx` (new), the
  page wrappers under `app/(app)/**`, `messages/en.ts` (own keys).
- **Size:** M
- **Unknowns:**
  - Where the slowness really is: the forge calls of the repository picker (sequential pages of `/user/repos` on
    every render, `app/(app)/settings/page.tsx` line 57) or something else; measured first. (owner: research;
    blocks: no)
  - Does `@softure-ai/theme-notion` or `@softure-ai/ui` already ship a page layout to adopt instead of a local
    one? A gap any app would hit goes to SOFTURE/AI. (owner: research; blocks: no)
- **Risk:** a cached repository list can be stale; the page must say when it was read and offer a refresh.
- **Baseline:** measure the Settings server render time with a fake forge that answers each page after a set delay
  (before: grows with the number of pages); after: the page renders without waiting for the forge, and
  screenshots of every screen at 1280 and 390 px, light and dark, show the same full-width layout.
- **PRD refs:** F-4, NFR-1, NFR-3, NFR-4
- **Input:** context/archive/2026-11-23-screens-share-one-full-width-layout/change.md

## Before the next release
Carried from cockpit-v1, settled against the forge on 2026-11-23 (change `reconcile-shipped-cockpit-v1`):
- [x] **CMP-8**: make sure every watched repository has the `owner-word` label — obsolete: COCKPIT refuses an answer in a repository without the label and names it (FR-5), so no separate check is needed
- [x] **CMP-8**: run the `release` workflow, then create the owner account — done: releases v2026.11.23-2 to v2026.11.23-6 (`release` runs green), deploy run 45180277732 verified `/api/health` 200 and 2 of 2 routes; the owner account exists (nine repositories added in Settings on 2026-11-23)
- [x] owner step: give the word to release the digest slice (**CMP-13**) — done: released in v2026.11.23-2 (version 0.7.0 carries 0.2.0); the digest stays off until the settings below
- [x] owner step: give the word to release the teams slice (**CMP-20**) — done: released in v2026.11.23-2; the admin role and the invitation check are the entry below
- [ ] **CMP-12**: turn the digest on: in Resend verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY`, `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) and `DIGEST_RECIPIENTS`, and the variables `MAIL_FROM` and optionally `DIGEST_AT`; after the next deploy the run checks the first digest and its unsubscribe link (README, "The digest in production"). Today all three secrets are empty (deploy run 45253324744).
- [ ] **CMP-20**: to invite teammates, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`; the invitation mail needs the digest's mail settings above
- [ ] **CMP-18**: to publish the CLI, store a granular npm token (read and write on the `@softure-ai` scope) as `NPM_TOKEN` in the `npm` environment and give the word to publish `@softure-ai/cockpit` 0.7.0 (`publish-cli` has never run)
- [ ] **CMP-21** (optional): to show health from observability, set the variable `GRAFANA_URL` and the secret `GRAFANA_TOKEN` (a Grafana service account that may read alert rules) in the `production` environment; today `GRAFANA_TOKEN` is empty

## Owner decisions and checks
- [x] **CMP-12** (carried from cockpit-v1): the mail provider key and a verified sender domain for the digest.
  Gates the digest's real send. — merged into the CMP-12 entry under `## Before the next release` (duplicate)

## Done
- **CV-1** `broadcast-reaches-every-project`: one broadcast from COCKPIT becomes exactly one owner-word issue with the broadcast's marker in every picked project, shown per project as sent, done or failed with a retry; archived in `archive/2026-11-23-broadcast-reaches-every-project/`

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
- v2: auto-pickup (F-2) → a new item CV-2 instead of growing CV-1: the wake-up task and its doctor check belong to
  `@softure-ai/skills` (AGENTS.md: a gap any app would hit goes to SOFTURE), filed as SOFTURE/SKILLS#81; CV-2 is
  `blocked` on it and only shows the declared wake-up; CV-1 drops its README wake-up section, which moves to CV-2.
- v2: Polish panel (F-3) → CV-3, a runtime locale with `en` as the default, because the repository stays generic
  and open source (AGENTS.md); copy lives in `messages/pl.ts` (the SOFTURE language rule's message-dictionary
  exception). Its own lane: no migration, parallel with CV-1.
- v2: Settings speed and one layout (F-4) → CV-4, one item, because the shared layout and the Settings fix touch
  the same page; lane C, kept apart from CV-3 in time since both edit Settings.
