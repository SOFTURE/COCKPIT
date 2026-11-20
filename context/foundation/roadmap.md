---
project: "COCKPIT"
roadmap: cockpit-v1
version: 1
status: ready
prd_version: 1
updated: 2026-11-20
---

# Roadmap cockpit-v1: one place to see every SOFTURE project and answer what waits for the owner

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: no (no release word yet; every release-ready item ends `done_code` waiting for the owner's word)
> - Parallelism: up to 4 at once
> - Owner at the keyboard: none (the owner gives words and secrets, listed below)
> - Start: no item starts before the owner's go (owner, 2026-11-20, translated: "build nothing and wait for the green light"); items beyond the first usable slice start only once their slice is funded

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CMP-1** | `app-shell-and-owner-sign-in` | (foundation) the owner signs in to an empty Notion-style shell; stack, gates and CI set | — | autonomous | ready |
| **CMP-2** | `owner-adds-watched-repositories` | the owner adds and removes watched repositories; missing permissions are named | CMP-1 | autonomous | ready |
| **CMP-3** | `projects-scanned-on-schedule-and-demand` | every project is read on a schedule and on demand; last read time and failures shown | CMP-2 | autonomous | ready |
| **CMP-4** | `decision-inbox-across-projects` | the owner sees every owner-queue entry of every project in one inbox, oldest first | CMP-3 | autonomous | ready |
| **CMP-5** | `answer-becomes-owner-word-issue` | Yes / No / Later with a note creates one owner-word issue; entry shows sent, then done | CMP-4 | autonomous | ready |
| **CMP-6** | `project-overview-with-status` | one row per project with roadmap X/N, queued, changes, waiting, release, quality review and a status | CMP-3 | autonomous | ready |
| **CMP-7** | `doctor-status-per-project` | each project shows whether its context/ contract passes the doctor | CMP-6 | autonomous | ready |
| **CMP-8** | `first-release-ready-to-deploy` | (release) the first usable slice is ready to deploy on the owner's server; deploys only on the owner's word | CMP-5, CMP-7 | autonomous | ready |
| **CMP-9** | `project-page-roadmap-and-owner-items` | each project is a page with roadmap items and stages, queued roadmaps, open changes, owner items, links | CMP-8 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-10** | `project-page-history-and-doctor-findings` | a project page shows recent merges, releases, CI and quality-review runs and doctor findings | CMP-9 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-11** | `project-page-release-ready` | (release) the project-page slice is ready to release; nothing released without the owner's word | CMP-10 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-12** | `digest-mail-when-something-changed` | one mail with what shipped, what waits and what broke, sent only when something changed | CMP-8 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-13** | `digest-release-ready` | (release) the digest slice is ready to release; nothing released without the owner's word | CMP-12 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-14** | `assistant-reads-cockpit-over-mcp` | an assistant connected over MCP reads the overview, the inbox and a project's detail | CMP-8 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-15** | `assistant-answers-entries-over-mcp` | with write access, an assistant answers an entry exactly as the inbox does | CMP-14, CMP-5 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-16** | `mcp-release-ready` | (release) the MCP slice is ready to release; nothing released without the owner's word | CMP-15 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-17** | `terminal-prints-cockpit-views` | a CLI prints the overview, the inbox and a project's detail | CMP-14 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-18** | `cli-release-ready` | (release) the CLI slice is ready to release and publish; nothing published without the owner's word | CMP-17 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-19** | `teammates-invited-and-attributed` | the owner invites teammates who see and answer the same projects; each answer shows who gave it | CMP-8 | autonomous | blocked (SOFTURE/AI#1406; funding: slice not funded yet) |
| **CMP-20** | `teams-release-ready` | (release) the teams slice is ready to release; nothing released without the owner's word | CMP-19 | autonomous | blocked (SOFTURE/AI#1406; funding: slice not funded yet) |
| **CMP-21** | `health-from-observability-adapter` | projects that report health through observability show it in the overview and project page | CMP-8 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-22** | `deploy-state-adapter` | projects show what version runs in production and whether the last deploy passed | CMP-21 | autonomous | blocked (funding: slice not funded yet) |
| **CMP-23** | `adapters-release-ready` | (release) the adapters slice is ready to release; nothing released without the owner's word | CMP-22 | autonomous | blocked (funding: slice not funded yet) |

## Order

**Optimising for:** a first usable slice the owner can open and use, quickly and simply (brief: "an explicit
first usable slice (MVP) ... ending in something I can open and use: inbox and overview from real state.json and
forge data, decisions as owner-word issues, deployed").
**First proof:** CMP-4, the first item that shows the owner every waiting decision from real data (G-1); the
north star (the one item that proves the idea) is CMP-5, the first answer that reaches a project without a prompt
(G-2).
**Main risk:** the state contract and the forge meet in the scan (CMP-3), and the owner's words (deploy, domain,
funding) gate the release and the later slices.
**Depth:** data and the one write (CMP-3, CMP-5); the UI stays on the theme's components.

CMP-1 sets the stack, the gates and CI, so every later item runs the same checks. CMP-2 and CMP-3 bring real data
in before any screen depends on it. CMP-4 is the first proof, and CMP-5 adds the only write as soon as there is
something to answer. CMP-6 and CMP-7 run in parallel with CMP-4 and CMP-5 once the scan exists, since they read
the same scan and add no migration. CMP-8 closes the first usable slice and waits for the owner's word to deploy.

Every later slice depends on CMP-8 and is `blocked (funding: ...)` until the owner funds it; each ends with its
own release-ready item. Teams also waits for SOFTURE/AI#1406.

### Sizes and slices (owner-requested)
The owner asked for a size per item and a total, to decide how much to fund (2026-11-20). Sizes are relative:
**S** about half an M (one phase, one surface), **M** a typical item (two or three phases), **L** about two Ms
(several phases or a new stack). Points: S 1, M 2, L 4. The hours are a very rough guide of one autonomous
thread's working time, not a promise (S ~2 h, M ~4 h, L ~8 h). SOFTURE/SKILLS#49 asks the skill to support this.

| Slice | Items and sizes | Points | Rough thread time |
| --- | --- | --- | --- |
| **MVP: first usable slice** | CMP-1 L, CMP-2 M, CMP-3 M, CMP-4 M, CMP-5 M, CMP-6 M, CMP-7 S, CMP-8 M | 17 | ~34 h |
| Project page | CMP-9 M, CMP-10 M, CMP-11 S | 5 | ~10 h |
| Digest | CMP-12 M, CMP-13 S | 3 | ~6 h |
| MCP | CMP-14 M, CMP-15 S, CMP-16 S | 4 | ~8 h |
| CLI | CMP-17 M, CMP-18 S | 3 | ~6 h |
| Teams | CMP-19 L, CMP-20 S | 5 | ~10 h |
| Adapters | CMP-21 M, CMP-22 M, CMP-23 S | 5 | ~10 h |
| **Total** | 23 items | 42 | ~84 h |

### Starting point (codebase, 2026-11-20)
- UI, server, data, auth, mail, observability: absent (only `context/`, `AGENTS.md`, `README.md`, `LICENSE`).
- Package: `package.json` with `@softure-ai/skills` 0.21.0 as the only dependency.
- CI: absent; it comes with the stack in CMP-1 (AGENTS.md, CI).
- Deploy: absent; CMP-8 adopts `@softure-ai/deploy` and `@softure-ai/host`.
- Modules to adopt instead of building: auth, jobs, mailing, mcp-access, security, db, core, ops, observability,
  deploy, host, theme-notion, ui, config, testing (versions checked on npm, 2026-11-20).

### Lanes
| Lane | Chain | Owns (estimate) | Note |
| --- | --- | --- | --- |
| A | CMP-1 → CMP-2 → CMP-3 → CMP-4 → CMP-5 | shell, `src/forge/client.ts`, `src/forge/issues.ts`, `src/projects/**`, `src/scan/**`, `src/state/**`, `src/inbox/**`, `src/decisions/**`, `src/shell/sidebar-inbox.tsx`, the MVP migrations | the must path; every MVP migration sits here |
| B | CMP-6 → CMP-7 → CMP-9 → CMP-10 | `src/overview/**`, `src/status/**`, `src/forge/runs.ts`, `src/forge/releases.ts`, `src/doctor/**`, `src/project-page/**`, `app/(app)/projects/**` | parallel with CMP-4 and CMP-5 once CMP-3 is merged; no migration |
| C | CMP-12 → CMP-14 → CMP-15 → CMP-17 | `src/digest/**`, `src/mcp/**`, `app/api/mcp/**`, `cli/**` | after CMP-8 and funding; CMP-12 and CMP-14 each add one migration, so they run one after the other |
| D | CMP-19 → CMP-21 → CMP-22 | `src/team/**`, `src/adapters/**` | after CMP-8 and funding; CMP-19 also waits for SOFTURE/AI#1406 |
| R | CMP-8 → CMP-11 → CMP-13 → CMP-16 → CMP-18 → CMP-20 → CMP-23 | `Dockerfile`, `compose.yaml`, `deploy/**`, `.github/workflows/deploy.yml`, `package.json` version, `CHANGELOG.md` | release files are owned here only, so two slices never edit them at once |

`messages/en.ts` is shared: each item adds only its own keys (namespaced by feature) and merges the main branch in
when it conflicts. `softure.config.ts` is touched by CMP-1, CMP-3, CMP-12 and CMP-14, which never run at the same
time (lanes A and C, ordered by dependencies).

Deferred: webhooks for instant refresh, forges other than GitHub, per-project visibility within a team (PRD, Out
of scope); nothing else was raised outside the PRD.

## Items

### CMP-1: App shell and owner sign-in
- **Change ID:** `app-shell-and-owner-sign-in`
- **Status:** ready
- **Outcome:** (foundation) the owner signs in with the account the operator created and sees the Notion-style shell (sidebar with Inbox, Projects, Settings; an empty inbox); nobody can sign up; the stack, the gates in `context/workflow.json` and CI on GitHub-hosted runners (gates, English-only check, `softure-skills doctor`) are in place.
- **Unlocks:** CMP-2 to CMP-8 (every screen lives in this shell; every later item runs the gates this item sets).
- **Prerequisites:** —
- **Touches (estimate):** `package.json`, `package-lock.json`, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `lefthook.yml`, `softure.config.ts`, `app/layout.tsx`, `app/(auth)/**`, `app/(app)/layout.tsx`, `src/shell/**`, `messages/en.ts`, `app/globals.css`, `.github/workflows/ci.yml`, `context/workflow.json`, `db/` (module migrations of auth and security), `README.md`.
- **Size (owner-requested):** L
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Which Postgres setup for local runs and tests (PGlite through `@softure-ai/db` or a container)? (owner: research; blocks: no)
  - Does `@softure-ai/theme-notion` with the `sft-bridge` render the auth package pages in the shell without local CSS? (owner: research; blocks: no)
- **Risk:** first because every other item builds in this shell and runs its gates; a wrong stack choice here costs every later item.
- **Baseline:** no application code, gates null in `workflow.json`; after: CI green on a pull request, a test signs the seeded owner in and finds the empty inbox, sign-up refused, the health endpoint answers ok.
- **PRD refs:** FR-1, NFR-3, NFR-4, NFR-6, NFR-8
- **Input:** context/changes/app-shell-and-owner-sign-in/change.md

### CMP-2: Owner adds watched repositories
- **Change ID:** `owner-adds-watched-repositories`
- **Status:** ready
- **Outcome:** the owner adds `owner/name` repositories on the Settings screen and removes them; COCKPIT checks it can read each one's `context/state.json`, marks "no state yet" where it is missing and names any missing permission; the projects appear in the sidebar.
- **Prerequisites:** CMP-1; a forge token for tests is fictional (fake forge).
- **Touches (estimate):** `src/forge/client.ts`, `src/forge/permissions.ts`, `src/projects/**`, `app/(app)/settings/**`, `src/shell/sidebar-projects.tsx`, `db/migrations/` (one: watched projects), `messages/en.ts` (own keys).
- **Size (owner-requested):** M
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - How does the forge report missing fine-grained permissions on a read (403 body, headers)? (owner: research; blocks: no)
- **Risk:** early because every scan and screen reads this list; it also proves the least-privilege access before anything writes.
- **Baseline:** no projects; after: a test adds a fictional repository through a fake forge, sees it in the sidebar, and sees a named missing permission for a second one.
- **PRD refs:** FR-2, NFR-5, NFR-6
- **Input:** context/changes/owner-adds-watched-repositories/change.md

### CMP-3: Projects scanned on a schedule and on demand
- **Change ID:** `projects-scanned-on-schedule-and-demand`
- **Status:** ready
- **Outcome:** every watched project's `context/state.json` and its owner-word issues are read every 30 minutes (15 to 60, configurable) and when the owner presses "Scan now"; each project shows when it was last read and why a read failed, and one failing project never stops the others.
- **Unlocks:** CMP-4 (inbox reads the stored state), CMP-6 (overview adds forge facts to the same scan).
- **Prerequisites:** CMP-2
- **Touches (estimate):** `src/scan/**`, `src/state/**` (schema check), `softure.config.ts` (jobs schedule), `app/(app)/scan-status/**`, `db/migrations/` (one: scan results stored as one document per project and scan).
- **Size (owner-requested):** M
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Does a stored document per project and scan stay small enough for 30 projects over months, or does only the latest need keeping? (owner: research; blocks: no)
- **Risk:** the riskiest technical step: the state contract and the forge limits meet here; a wrong reader here makes every screen wrong.
- **Baseline:** no reads; after: a test runs the scheduled scan over three fictional projects (one failing) and finds two read and one failure with its reason; the run uses the jobs schedule once per period.
- **PRD refs:** FR-3, NFR-2, NFR-7
- **Input:** context/changes/projects-scanned-on-schedule-and-demand/change.md

### CMP-4: Decision inbox across projects
- **Change ID:** `decision-inbox-across-projects`
- **Status:** ready
- **Outcome:** the owner opens the inbox and sees every open owner-queue entry of every project, oldest first, with project, kind (word, decision, step, secret), source, item and age as property chips; the sidebar shows the count; the inbox is usable on a 390 px phone.
- **Prerequisites:** CMP-3
- **Touches (estimate):** `app/(app)/inbox/**`, `src/inbox/**`, `src/shell/sidebar-inbox.tsx`, `messages/en.ts` (own keys).
- **Size (owner-requested):** M
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Group by project as a view option, or age only in this item? (owner: research, PRD FR-4 challenge; blocks: no)
- **Risk:** the first proof: the first time the owner sees value from real data; it goes right after the scan.
- **Baseline:** no inbox; after: a test with fictional projects holding 2, 0 and 5 entries shows 7 rows oldest first; the phone check (`@softure-ai/testing`) passes at 390 px with 44 px targets.
- **PRD refs:** FR-4, NFR-1, NFR-3, NFR-4, G-1
- **Input:** context/changes/decision-inbox-across-projects/change.md

### CMP-5: An answer becomes an owner-word issue
- **Change ID:** `answer-becomes-owner-word-issue`
- **Status:** ready
- **Outcome:** the owner answers an entry Yes, No or Later with an optional note; exactly one issue labelled `owner-word` is created in that project; the entry shows "sent" with the link, "done" once the issue is closed, and "the entry changed since" when the project rewords it.
- **Prerequisites:** CMP-4
- **Touches (estimate):** `src/decisions/**`, `src/forge/issues.ts`, `app/(app)/inbox/answer/**`, `db/migrations/` (one: answers with who answered), `messages/en.ts` (own keys).
- **Size (owner-requested):** M
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Which fingerprint keeps an entry stable across rewrites until SOFTURE/SKILLS#48 adds ids? (owner: research; blocks: no)
  - How does the coordinator read the issue body: prose plus a hidden marker as proposed in SOFTURE/SKILLS#48? (owner: research; blocks: no)
- **Risk:** the only write COCKPIT makes; double answers or a write outside issue creation would break the core rule and NFR-7.
- **Baseline:** answers travel as hand-written prompts; after: a test answers an entry twice at once and finds one issue on the fake forge, then closes it and sees "done"; a test fails on any other writing request.
- **PRD refs:** FR-5, FR-6, NFR-7, G-2, G-4
- **Input:** context/changes/answer-becomes-owner-word-issue/change.md

### CMP-6: Project overview with status
- **Change ID:** `project-overview-with-status`
- **Status:** ready
- **Outcome:** the owner opens the overview: one row per project, grouped by status (broken, waiting for you, stalled, moving, idle), with active roadmap X/N and title, queued roadmaps, open changes, waiting count, last release from the forge, last CI and quality-review result; the sidebar shows each project's status icon.
- **Prerequisites:** CMP-3
- **Touches (estimate):** `app/(app)/overview/**`, `src/overview/**`, `src/status/**`, `src/forge/runs.ts`, `src/forge/releases.ts`, `src/scan/forge-facts.ts`, `src/shell/sidebar-projects.tsx` (status icon only), `messages/en.ts` (own keys).
- **Size (owner-requested):** M
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Which workflow names identify CI, quality review and CI usage runs across projects (fixed names from the reusable workflows, or configurable)? (owner: research; blocks: no)
- **Risk:** runs in parallel with CMP-4 and CMP-5 once CMP-3 is merged; no migration (forge facts ride the scan document).
- **Baseline:** no overview; after: fixtures produce each of the five statuses, and the values match `npx softure-skills portfolio --json` on the same fictional projects.
- **PRD refs:** FR-7, FR-8, NFR-1, G-3
- **Input:** context/changes/project-overview-with-status/change.md

### CMP-7: Doctor status per project
- **Change ID:** `doctor-status-per-project`
- **Status:** ready
- **Outcome:** each project's row shows the doctor result (OK, or the number of failures), read by running the packaged doctor on a sparse checkout of `context/` of its main branch; a failing doctor makes the project broken.
- **Prerequisites:** CMP-6
- **Touches (estimate):** `src/doctor/**`, `src/scan/doctor-step.ts`, `messages/en.ts` (own keys); the runtime image's python3 and git are added by CMP-8, which owns the `Dockerfile`.
- **Size (owner-requested):** S
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Does a sparse, blob-less clone of `context/` stay under a few seconds per project with the token over HTTPS? (owner: research; blocks: no)
- **Risk:** small, but it needs python3 in the runtime; switch to the forge check once SOFTURE/SKILLS#48 lands.
- **Baseline:** doctor column shows "n/a"; after: a fixture repository with a drifted `context/` shows the failure count, a clean one shows OK.
- **PRD refs:** FR-7, FR-8
- **Input:** context/changes/doctor-status-per-project/change.md

### CMP-8: First release ready to deploy
- **Change ID:** `first-release-ready-to-deploy`
- **Status:** ready
- **Outcome:** the first usable slice is packaged for one server through `@softure-ai/deploy` and `@softure-ai/host` (container, deploy workflow, the secret names, health verification, release notes); a dry run passes; it is deployed and verified only after the owner's word and domain.
- **Prerequisites:** CMP-5, CMP-7; the owner's domain and server (OQ-1) and the release word for the deploy step only.
- **Touches (estimate):** `Dockerfile`, `compose.yaml`, `.github/workflows/deploy.yml`, `deploy/**`, `package.json` (version), `CHANGELOG.md`, `README.md` (operator section: token permissions, secrets, first account).
- **Size (owner-requested):** M
- **Slice:** MVP (first usable slice)
- **Unknowns:**
  - Which domain and server? (owner: owner, OQ-1; blocks: no for the build, yes for the deploy step)
- **Risk:** last of the slice: it needs the whole slice; the deploy itself waits for the owner (AGENTS.md: "No release, tag, npm publish or deploy without the owner's word").
- **Baseline:** nothing deployable; after: the deploy dry run and the container health check pass in CI; after the owner's word: the health endpoint answers ok on the owner's domain and a first scan completes.
- **PRD refs:** FR-9, NFR-5, NFR-6
- **Input:** context/changes/first-release-ready-to-deploy/change.md

### CMP-9: Project page: roadmap and owner items
- **Change ID:** `project-page-roadmap-and-owner-items`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the owner opens a project as a page: active roadmap items with their stages, queued roadmaps with their start condition, open changes, the owner's entries for this project (answerable as in the inbox) and links to the repository.
- **Prerequisites:** CMP-8; the owner funds the project-page slice.
- **Touches (estimate):** `app/(app)/projects/[slug]/page.tsx`, `src/project-page/**`, `messages/en.ts` (own keys).
- **Size (owner-requested):** M
- **Slice:** Project page
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** after the first usable slice: value 3 in the brief.
- **Baseline:** no project page; after: a fixture project shows its items, stages and owner entries.
- **PRD refs:** FR-10, G-3
- **Input:** context/changes/project-page-roadmap-and-owner-items/change.md

### CMP-10: Project page: history and doctor findings
- **Change ID:** `project-page-history-and-doctor-findings`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** a project page shows recent merges and releases, the latest CI and quality-review runs and the doctor's findings with their codes.
- **Prerequisites:** CMP-9; the owner funds the project-page slice.
- **Touches (estimate):** `app/(app)/projects/[slug]/history/**`, `src/project-page/history/**`, `src/forge/merges.ts`.
- **Size (owner-requested):** M
- **Slice:** Project page
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** reads more forge endpoints per project; checks NFR-2 again.
- **Baseline:** history not shown; after: a fixture project shows its last merges, releases, runs and findings.
- **PRD refs:** FR-11, NFR-2
- **Input:** context/changes/project-page-history-and-doctor-findings/change.md

### CMP-11: Project page release ready
- **Change ID:** `project-page-release-ready`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the project-page slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.
- **Prerequisites:** CMP-10; the owner funds the project-page slice.
- **Touches (estimate):** `package.json` (version), `CHANGELOG.md`.
- **Size (owner-requested):** S
- **Slice:** Project page
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** closes the slice.
- **Baseline:** unreleased; after: dry run green, release notes list CMP-9 and CMP-10.
- **PRD refs:** FR-9
- **Input:** context/changes/project-page-release-ready/change.md

### CMP-12: Digest mail when something changed
- **Change ID:** `digest-mail-when-something-changed`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the owner receives one digest mail on a schedule listing what shipped, what waits for them and what broke since the last digest; nothing is sent when nothing changed; one-click unsubscribe works.
- **Prerequisites:** CMP-8; the owner funds the digest slice; a mail provider key and a verified sender (owner step).
- **Touches (estimate):** `src/digest/**`, `softure.config.ts` (mailing and a digest schedule), `db/migrations/` (one: digest log), `messages/en.ts` (own keys).
- **Size (owner-requested):** M
- **Slice:** Digest
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
  - Digest time and recipients (owner: owner; blocks: no)
- **Risk:** needs an owner secret before it can be verified for real.
- **Baseline:** no mail; after: a test with two scans and no change sends nothing; with a change sends one mail.
- **PRD refs:** FR-12, G-5
- **Input:** context/changes/digest-mail-when-something-changed/change.md

### CMP-13: Digest release ready
- **Change ID:** `digest-release-ready`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the digest slice has its release notes, version and secret names, passes the deploy dry run, and waits for the owner's word.
- **Prerequisites:** CMP-12; the owner funds the digest slice.
- **Touches (estimate):** `package.json` (version), `CHANGELOG.md`, `compose.yaml` (secret names).
- **Size (owner-requested):** S
- **Slice:** Digest
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** closes the slice.
- **Baseline:** unreleased; after: dry run green, release notes list CMP-12.
- **PRD refs:** FR-9
- **Input:** context/changes/digest-release-ready/change.md

### CMP-14: Assistant reads COCKPIT over MCP
- **Change ID:** `assistant-reads-cockpit-over-mcp`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the owner connects an assistant with a read token or OAuth and asks for the overview, the inbox and a project's detail; the answers match the screens.
- **Prerequisites:** CMP-8; the owner funds the MCP slice.
- **Touches (estimate):** `src/mcp/**`, `app/api/mcp/**`, `softure.config.ts` (mcp-access), `db/` (module migrations of mcp-access).
- **Size (owner-requested):** M
- **Slice:** MCP
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** the phone path through an assistant.
- **Baseline:** no MCP; after: the catalog parity check passes and each read tool returns the fixture data.
- **PRD refs:** FR-13, G-5
- **Input:** context/changes/assistant-reads-cockpit-over-mcp/change.md

### CMP-15: Assistant answers entries over MCP
- **Change ID:** `assistant-answers-entries-over-mcp`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** with a write token, the owner answers an entry through an assistant; the same rule as the inbox applies (one issue, sent, done); a read token is refused.
- **Prerequisites:** CMP-14, CMP-5; the owner funds the MCP slice.
- **Touches (estimate):** `src/mcp/tools/decide.ts`.
- **Size (owner-requested):** S
- **Slice:** MCP
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** a second path to the only write; it reuses CMP-5's rule, never a copy.
- **Baseline:** answers only from the inbox; after: a test answers through the tool and finds one issue.
- **PRD refs:** FR-14, G-2, G-5
- **Input:** context/changes/assistant-answers-entries-over-mcp/change.md

### CMP-16: MCP release ready
- **Change ID:** `mcp-release-ready`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the MCP slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.
- **Prerequisites:** CMP-15; the owner funds the MCP slice.
- **Touches (estimate):** `package.json` (version), `CHANGELOG.md`.
- **Size (owner-requested):** S
- **Slice:** MCP
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** closes the slice.
- **Baseline:** unreleased; after: dry run green, release notes list CMP-14 and CMP-15.
- **PRD refs:** FR-9
- **Input:** context/changes/mcp-release-ready/change.md

### CMP-17: Terminal prints COCKPIT views
- **Change ID:** `terminal-prints-cockpit-views`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the owner runs the CLI with a read token and prints the overview, the inbox and a project's detail as tables (and JSON).
- **Prerequisites:** CMP-14; the owner funds the CLI slice.
- **Touches (estimate):** `cli/**`, `package.json` (bin).
- **Size (owner-requested):** M
- **Slice:** CLI
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** reuses the MCP read tools as its API, so it adds no endpoint of its own.
- **Baseline:** no CLI; after: the CLI prints the fixture overview equal to the screen.
- **PRD refs:** FR-15, G-5
- **Input:** context/changes/terminal-prints-cockpit-views/change.md

### CMP-18: CLI release ready
- **Change ID:** `cli-release-ready`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the CLI slice has its release notes and version and a publish dry run; nothing is published to npm without the owner's word.
- **Prerequisites:** CMP-17; the owner funds the CLI slice.
- **Touches (estimate):** `package.json` (version), `CHANGELOG.md`, `.github/workflows/publish-cli.yml`.
- **Size (owner-requested):** S
- **Slice:** CLI
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** the only npm publish in the roadmap.
- **Baseline:** unpublished; after: `npm publish --dry-run` green.
- **PRD refs:** FR-15
- **Input:** context/changes/cli-release-ready/change.md

### CMP-19: Teammates invited and attributed
- **Change ID:** `teammates-invited-and-attributed`
- **Status:** blocked (SOFTURE/AI#1406; funding: slice not funded yet)
- **Outcome:** the owner invites teammates by email; they see and answer the same projects; every answer and every owner-word issue shows who gave it.
- **Prerequisites:** CMP-8; SOFTURE/AI#1406 released; the owner funds the teams slice.
- **Touches (estimate):** `src/team/**`, `app/(app)/settings/team/**`, `db/migrations/` (one: attribution if not already present), `messages/en.ts` (own keys).
- **Size (owner-requested):** L
- **Slice:** Teams
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
  - Invitations while registration is closed (SOFTURE/AI#1406; blocks: yes)
- **Risk:** depends on a package gap; the answer history keeps who answered from CMP-5 on, so no meaning changes.
- **Baseline:** one owner; after: an invited fictional teammate answers an entry and the issue names them.
- **PRD refs:** FR-16, G-2
- **Input:** context/changes/teammates-invited-and-attributed/change.md

### CMP-20: Teams release ready
- **Change ID:** `teams-release-ready`
- **Status:** blocked (SOFTURE/AI#1406; funding: slice not funded yet)
- **Outcome:** the teams slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.
- **Prerequisites:** CMP-19.
- **Touches (estimate):** `package.json` (version), `CHANGELOG.md`.
- **Size (owner-requested):** S
- **Slice:** Teams
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** closes the slice.
- **Baseline:** unreleased; after: dry run green, release notes list CMP-19.
- **PRD refs:** FR-9
- **Input:** context/changes/teams-release-ready/change.md

### CMP-21: Health from observability adapter
- **Change ID:** `health-from-observability-adapter`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** an optional adapter reads each project's health from its observability backend; the overview and project page show it; projects without it show nothing extra.
- **Prerequisites:** CMP-8; the owner funds the adapters slice.
- **Touches (estimate):** `src/adapters/contract.ts`, `src/adapters/observability/**`.
- **Size (owner-requested):** M
- **Slice:** Adapters
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
  - Which health signal per project (an alert state, an error rate)? (owner: research; blocks: no)
- **Risk:** first adapter defines the adapter contract the second reuses.
- **Baseline:** no health shown; after: a fake backend's failing health shows on the fixture project.
- **PRD refs:** FR-17, G-3
- **Input:** context/changes/health-from-observability-adapter/change.md

### CMP-22: Deploy state adapter
- **Change ID:** `deploy-state-adapter`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** an optional adapter shows which version runs in production and whether the last deploy and its verification passed.
- **Prerequisites:** CMP-21; the owner funds the adapters slice.
- **Touches (estimate):** `src/adapters/deploy/**`.
- **Size (owner-requested):** M
- **Slice:** Adapters
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** reads the deploy workflow runs and release reports; no access to servers.
- **Baseline:** no deploy state; after: a fixture deploy run shows its version and result.
- **PRD refs:** FR-17, G-3
- **Input:** context/changes/deploy-state-adapter/change.md

### CMP-23: Adapters release ready
- **Change ID:** `adapters-release-ready`
- **Status:** blocked (funding: slice not funded yet)
- **Outcome:** the adapters slice has its release notes and version, passes the deploy dry run, and waits for the owner's word.
- **Prerequisites:** CMP-22; the owner funds the adapters slice.
- **Touches (estimate):** `package.json` (version), `CHANGELOG.md`.
- **Size (owner-requested):** S
- **Slice:** Adapters
- **Unknowns:**
  - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
- **Risk:** closes the slice.
- **Baseline:** unreleased; after: dry run green, release notes list CMP-21 and CMP-22.
- **PRD refs:** FR-9
- **Input:** context/changes/adapters-release-ready/change.md

## Before the next release
- [ ] **CMP-8**: create a fine-grained personal access token limited to the watched repositories (Metadata: read, Contents: read, Issues: read and write, Pull requests: read, Actions: read) and store it as the deployment secret
- [ ] **CMP-8**: make sure every watched repository has the `owner-word` label (the `@softure-ai/skills` installer creates it)
- [ ] **CMP-8**: onboard the app on the owner's server with `@softure-ai/host`, point the domain at it, and set the database and session secrets
- [ ] **CMP-8**: create the owner account with the auth `create-account` script after the first deploy

## Owner decisions and checks
- [ ] **CMP-8**: choose the domain and the server for the first deployment (PRD OQ-1), and give the word to deploy. Gates only CMP-8's deploy step.
- [ ] **CMP-9 to CMP-23**: decide which slices to fund after the first usable slice (PRD OQ-2): project page (CMP-9 to CMP-11), digest (CMP-12, CMP-13), MCP (CMP-14 to CMP-16), CLI (CMP-17, CMP-18), teams (CMP-19, CMP-20), adapters (CMP-21 to CMP-23). Gates those items.
- [ ] **CMP-12**: the mail provider key and a verified sender domain for the digest. Gates CMP-12's real send.

## Done

## Decisions (auto)
- Readiness check → 4/4 (summary complete, `must` FRs with Given/When/Then, goals with numbers, no open question
  gates a `must` FR); PRD v1 accepted → proceed.
- Baseline → probes unconfirmed (autonomous); every layer absent except the skills package.
- Optimising for → a first usable slice, quickly and simply (the owner's brief); first proof CMP-4; main risk the
  scan and the owner's words.
- Sizes → added on the owner's explicit request ("A size per item (S / M / L) and a rough total effort"), although
  the skill forbids them; recorded per item as `Size (owner-requested)` and summed under `## Order`; gap filed as
  SOFTURE/SKILLS#49.
- Slices → one main roadmap with all slices instead of queued roadmaps, so every item has its change folder now
  (the owner's step 4) and one table shows the whole plan; items beyond the first usable slice are
  `blocked (funding: ...)` until the owner funds them.
- Release-ready items → one per slice (the brief: "The last item of each slice prepares the release; nothing is
  released without my word"); all in lane R because they edit the same release files.
- Doctor column → a separate small item (CMP-7) so CMP-6 adds no runtime dependency on python3.
- CLI → reads through the MCP read tools (CMP-14) instead of a separate API.
- Teams → `blocked (SOFTURE/AI#1406; funding ...)`; the answer history records who answered from CMP-5 on.
