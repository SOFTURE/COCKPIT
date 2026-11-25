---
project: "COCKPIT"
version: 3
status: accepted
context_type: greenfield
created: 2026-11-20
updated: 2026-11-20
source: shape-notes.md (session 1)
---

# PRD v3: one place to see every SOFTURE project and answer what waits for the owner

## Summary
- Problem: the owner of several autonomous SOFTURE projects (seven today) reviews every repository by hand,
  often several times a day, to find the few decisions only they can make, then writes a prompt per project to
  act on each one; they lose track of what runs where.
- Insight: every project already publishes what waits for the owner (`context/state.json`, `owner_queue`) and
  accepts the owner's written word as an `cockpit` issue, so answering does not need the project's chat: one
  inbox over all projects can carry the answer back as that issue.
- Who: the owner of several SOFTURE projects run in autonomous mode.
- Outcome: the owner opens one page (desktop or phone), sees every decision waiting across projects and each
  project's status, answers with Yes / No / Later, and the project's coordinator receives the answer without a
  prompt being written.
- Appetite: every slice is funded (the owner, 2026-11-20, translated: "all in, everything is to be built"; OQ-2
  answered); deadline: none.
- Product: web app (with an MCP endpoint and a CLI in later slices); expected scale: one owner, a handful to
  dozens of projects (room for about thirty).
- Release boundary: the first release is the first usable slice: inbox, overview, decisions as cockpit
  issues, from real data, deployed on the owner's server. Project page, digest, MCP, CLI, teams and adapters are
  later releases.

## Goals
- G-1: The owner finds every decision waiting across all watched projects in one list, without opening a
  repository. Check: every `owner_queue` entry of every watched project appears in the inbox within one scan
  interval (yes/no on fixtures and on the live projects).
- G-2: An answer reaches the project without a prompt being written. Target: at least 80% of cockpit issues
  in the watched projects are created from COCKPIT within four weeks of the first deployment.
- G-3: The owner sees where each project stands at a glance. Check: each project shows one status (broken,
  waiting for you, stalled, moving, idle) and the numbers behind it, matching
  `npx softure-skills portfolio --json` column for column.
- G-4: Decisions are answered faster. Target: median time from an entry's `since` to its answer under 24 hours,
  measured over four weeks after the first deployment (baseline unknown, OQ-3).
- G-5 (later slices): the owner reads and decides away from the inbox: by a mail digest, through an assistant
  over MCP, and from a terminal.

## Non-goals
- Managing the projects from COCKPIT (editing roadmaps, merging, releasing) — the projects' coordinators do that;
  COCKPIT only carries the owner's word.
- Trends, charts and analytics over time — no question in the brief needs them.
- Watching repositories that do not follow the SOFTURE workflow — there is no state to read.
- Forges other than GitHub in this release — every watched project is on GitHub today.
- Real-time updates — a scan every 15 to 60 minutes plus "scan now" is enough for decisions that wait hours.

## Users
- Primary: the owner of several SOFTURE projects in autonomous mode; reaches for COCKPIT whenever they want to
  know "what waits for me" or "where does project X stand", several times a day, on a desktop or, for the inbox,
  on a phone.
- Secondary (later slice): up to about five teammates sharing the same projects, invited by the owner.
- Not for: anyone without the owner's invitation; clients of the watched projects; the public.

## Access control
- One owner account, created by the operator before the first sign-in; registration is closed and the sign-up
  page offers nothing.
- A visitor who is not signed in sees only the sign-in page; every screen, action, MCP tool and CLI call requires
  a signed-in owner or the owner's token.
- The owner sees and answers every watched project.
- Later slice (teams): the owner invites teammates by email; a teammate sees and answers the same projects; every
  answer records who gave it.
- Toward watched repositories COCKPIT reads only, and its one write is creating cockpit issues. The forge
  access it holds is limited to the watched repositories and to the permissions those reads and that creation
  need (NFR-5).

## Primary flow
1. The owner signs in. (FR-1)
2. The owner adds the repositories to watch, once. (FR-2)
3. COCKPIT scans every watched project on its schedule, or when the owner asks. (FR-3)
4. The owner opens the inbox: every owner-queue entry of every project, oldest first. (FR-4)
5. The owner answers an entry with Yes, No or Later and an optional note. (FR-5)
6. The answer becomes a cockpit issue in that project; the entry shows "sent", later "done". (FR-5, FR-6)
7. The owner opens the overview and sees each project's status and numbers. (FR-7, FR-8)
8. The first release is deployed on the owner's server once the owner gives the word. (FR-9)

## Business rules
Core rule: every open owner-queue entry of every watched project is answered at most once; an answer becomes
exactly one cockpit issue in that project, the entry shows "sent" while that issue is open and "done" once
it is closed, and the entry leaves the inbox only when the project's own state stops listing it.

An entry is identified by its project and its content (kind, source, item, text). An entry whose text changes is
a new entry; an earlier answer to the old wording stays visible with the note "the entry changed since". An
answer of "Later" is an answer too: it creates an issue that tells the coordinator to record it.

A project's status is the first that applies: **broken** (its state cannot be read, the doctor fails, or the
latest CI run on its main branch failed), **waiting for you** (at least one unanswered entry), **stalled** (open
roadmap items, no change of its state for longer than the stall threshold, default 48 hours), **moving** (open
work that changed within the threshold), **idle** (nothing open, nothing waiting).

## Functional requirements
| ID | Requirement (observable behaviour) | Priority | Goal | Module |
|---|---|---|---|---|
| FR-1 | When the owner signs in with the account the operator created, they reach the inbox; nobody can sign up | must | G-1 | @softure-ai/auth |
| FR-2 | When the owner adds or removes a watched repository, COCKPIT confirms it can read that project's state and lists missing permissions | must | G-1 | — |
| FR-3 | On a schedule and on demand, COCKPIT reads every watched project's state and forge data; each project shows when it was last read and any read failure | must | G-1, G-3 | @softure-ai/jobs |
| FR-4 | When the owner opens the inbox, they see every open owner-queue entry of every project, oldest first, with project, kind, source, item and age | must | G-1 | @softure-ai/theme-notion |
| FR-5 | When the owner answers an entry Yes, No or Later with an optional note, a cockpit issue is created in that project and the entry shows "sent" | must | G-2 | — |
| FR-6 | When the cockpit issue of an answer is closed, the entry shows "done"; when the project's state stops listing the entry, it leaves the inbox | must | G-2 | — |
| FR-7 | When the owner opens the overview, each project shows its active roadmap X/N and title, queued roadmaps, open changes, waiting count, last release, doctor status and last quality review | must | G-3 | — |
| FR-8 | Each project shows one status computed by the core rule, in the overview and the sidebar | must | G-3 | — |
| FR-9 | The first release can be deployed to one server with one command after the owner's word, and its health can be checked from outside | must | G-1 | @softure-ai/deploy, @softure-ai/ops |
| FR-10 | When the owner opens a project page, they see its active roadmap items with stages, queued roadmaps with start conditions, open changes, the owner's entries for this project and links to the repository | should | G-3 | — |
| FR-11 | On a project page the owner sees the recent merges, releases, CI and quality-review runs, and the doctor's findings | should | G-3 | — |
| FR-12 | When something changed since the last digest, the owner receives one mail listing what shipped, what waits for them and what broke; nothing is sent when nothing changed | should | G-5 | @softure-ai/mailing |
| FR-13 | Through an assistant connected over MCP, the owner reads the overview, the inbox and a project's detail | should | G-5 | @softure-ai/mcp-access |
| FR-14 | Through an assistant connected over MCP with write access, the owner answers an entry exactly as in the inbox | should | G-2, G-5 | @softure-ai/mcp-access |
| FR-15 | From a terminal, the owner prints the overview, the inbox and a project's detail | could | G-5 | — |
| FR-16 | The owner invites teammates who then see and answer the same projects; every answer shows who gave it | could | G-2 | @softure-ai/auth (invitations, 0.2.20) |
| FR-17 | When a project reports health from observability or deploy state, the overview and project page show it | could | G-3 | @softure-ai/observability |

### FR-1: Owner sign-in
Acceptance:
- Given the operator created the owner account, when the owner signs in with its email and password, then the
  inbox opens.
- Given no session, when anyone opens any page or endpoint other than sign-in and health, then they get the
  sign-in page (or 401 for an endpoint) and no project data.
- Given registration is closed, when anyone opens the sign-up page, then no account can be created.
Challenge: a password account is one more secret than signing in with GitHub → it stands: GitHub sign-in needs
an OAuth App only the owner can create, and it can be added later without changing who sees what.

### FR-2: Watched repositories
Acceptance:
- Given the owner enters `owner/name`, when COCKPIT can read that repository's `context/state.json` on its main
  branch, then the project is added and appears in the sidebar.
- Given the repository has no `context/state.json`, then it is added and marked "no state yet", with the hint to
  update `@softure-ai/skills`.
- Given the configured access cannot read the repository or lacks a permission, then the project is not added
  (or is marked) and the missing permission is named.
- Given the owner removes a project, then its entries leave the inbox; its answers stay in the history.
- The list of watched repositories is never part of the repository's files.
Challenge: a settings screen is more than an environment variable → it stands: adding a project should not need
a redeploy; the screen is small.

### FR-3: Scan
Acceptance:
- Given the interval is set (default 30 minutes, allowed 15 to 60), when the interval passes, then every
  watched project is read once, even with several running instances.
- Given the owner presses "Scan now", then a scan starts within 10 seconds and the screens show its progress or
  result.
- Given one project fails to read (no access, invalid state, forge unavailable), then the other projects are
  still read, and that project shows the failure and the time of its last good read.
- Given the forge reports its limit is near, then the scan waits and resumes instead of failing all projects.
- A scan reads only: no request it makes changes a watched repository.
Challenge: scanning on a schedule could be replaced by webhooks → it stands: webhooks need a public receiver and
per-repository setup; a 30-minute scan is enough for decisions that wait hours.

### FR-4: Decision inbox
Acceptance:
- Given three projects with 2, 0 and 5 entries, when the owner opens the inbox, then 7 rows appear, oldest
  `since` first, each with project, kind (word, decision, step, secret), source, item and age in days.
- Given an entry of kind `secret`, then its text is shown as the project wrote it and COCKPIT never asks for or
  stores the secret itself.
- Given no entries, then the inbox says nothing waits and when the last scan ran.
- Given an entry already answered, then it shows "sent" or "done" and offers no second answer.
- The sidebar shows the number of unanswered entries.
- On a 390 px wide phone screen every row is readable and every answer control is at least 44 px high.
Challenge: rows could be grouped by project instead of by age → it stands as the default (the brief: "oldest
first"); grouping by project is a view option, not a requirement.

### FR-5: Answer an entry
Acceptance:
- Given an unanswered entry, when the owner chooses Yes, No or Later (optionally with a note) and confirms, then
  exactly one issue labelled `cockpit` is created in that project's repository, quoting the entry, its source
  and item, the answer and the note, and the entry shows "sent" with a link to the issue.
- Given the same entry is answered twice (double click, two devices), then only one issue exists.
- Given the issue cannot be created (no permission, forge down), then the entry stays unanswered, the owner sees
  why, and nothing is recorded as sent.
- Given the label `cockpit` does not exist in that repository, then the owner sees that, and no unlabelled
  issue is created.
Challenge: "Later" could just hide the entry locally → it stands: the brief turns every answer into the
project's issue, so the project records the "later" too.

### FR-6: Answer lifecycle
Acceptance:
- Given an answer whose issue is closed, when the next scan runs, then the entry shows "done".
- Given the project's state no longer lists the entry, then it leaves the inbox, and the answer stays in the
  history with its issue link.
- Given the entry's text changed after the answer, then the new text is a new unanswered entry and the old answer
  shows "the entry changed since".
- Given a cockpit issue created outside COCKPIT names an entry, then that entry shows "sent" too.
Challenge: matching closed issues to entries depended on COCKPIT's own fingerprint → v3: entries carry a stable
id and the cockpit issue names it (SOFTURE/SKILLS#48, released), so the match uses the id; "the entry changed
since" means the same id with new text.

### FR-7: Overview
Acceptance:
- Given seven watched projects, when the owner opens the overview, then seven rows show: name, status, active
  roadmap X/N and title, queued roadmaps, open changes, waiting count, last release with date, doctor status, last
  quality review result and date, last read time.
- Given a project without an active roadmap, then that cell says so instead of 0/0.
- Every value equals what `npx softure-skills portfolio --json` reports for the same projects at the same commit
  (last release from the forge first).
- Rows are grouped by status (broken first, then waiting for you, stalled, moving, idle).
Challenge: the doctor column needs the doctor run outside the project → it stands: the doctor is part of the
brief's overview; it is read the cheapest available way (Forward notes).

### FR-8: Project status
Acceptance:
- Each of the five statuses is produced by a fixture that meets exactly its condition, and the order of the core
  rule decides when several apply.
- A status always shows a word and an icon, never colour alone.
Challenge: five statuses where the brief named four → it stands: `idle` keeps a finished project from showing as
stalled (Decisions (auto)).

### FR-9: First deployment
Acceptance:
- Given the owner's word, when the deployment runs, then COCKPIT is reachable at the owner's domain over HTTPS,
  its health endpoint answers ok, and a first scan of the configured projects completes.
- The deployment's configuration names every secret it needs (database, forge access, mail sender later) without
  any value in the repository.
- Nothing is deployed, tagged or published without the owner's word.
Challenge: deployment could wait for a later slice → it stands: the brief's first usable slice ends "deployed".

### FR-10: Project page: roadmap and owner items
Acceptance:
- Given a project with an active roadmap of five items, when the owner opens its page, then the five items show
  with their ID, outcome and stage, in roadmap order.
- Given a project with a queued roadmap, then its title and start condition show under the active one.
- Given open entries for this project, then they show on the page and answer exactly as in the inbox (FR-5).
- Given a project without an active roadmap or without `context/state.json`, then the page says so instead of an
  empty table.
- Given the last read failed, then the page shows the last good data with the failure and its time.

### FR-11: Project page: history and doctor findings
Acceptance:
- Given a project with merges, releases and CI runs, when the owner opens the history, then the latest ten
  merges, the latest five releases and the latest CI and quality-review runs show with their dates and links.
- Given a failing doctor, then each finding shows with its code and the file it names.
- Given the forge refuses one of these reads, then that block shows the reason and the rest of the page loads.
- Given 30 watched projects, then a full scan with history still meets NFR-2.

### FR-12: Digest mail
Acceptance:
- Given two scans with no change between them, when the digest time comes, then no mail is sent.
- Given a merged item, a new entry and a project that turned broken since the last digest, then one mail lists
  them under "shipped", "waits for you" and "broke", each with a link.
- Given the recipient unsubscribes with one click, then no further digest is sent until they subscribe again.
- Given the mail provider fails, then the digest is retried and the failure is visible in the app; nothing is
  marked sent.

### FR-13: Reading over MCP
Acceptance:
- Given an assistant connected with a read token, when it calls the overview, inbox and project tools, then the
  answers hold the same values as the screens for the same scan.
- Given no token or a revoked token, then every tool refuses without data.
- Given a read token, then no tool that answers an entry is listed.

### FR-14: Answering over MCP
Acceptance:
- Given a write token, when the assistant answers an entry Yes, No or Later with a note, then exactly one
  cockpit issue is created and the entry shows "sent", as in FR-5.
- Given a read token, then the answer is refused and nothing is written.
- Given the entry was already answered, then the tool returns the existing answer and creates no second issue.

### FR-15: Terminal views
Acceptance:
- Given a read token, when the owner runs the overview, inbox or project command, then a table prints with the
  same values as the screen; `--json` prints the same data as JSON.
- Given no token or an unreachable COCKPIT, then the command exits non-zero with a message that names the cause
  and prints no stack trace.

### FR-16: Teammates
Acceptance:
- Given the owner invites an email, when the invitee accepts the link, then they sign in and see the same
  projects, inbox and overview while sign-up stays closed for everyone else.
- Given a teammate answers an entry, then the answer history and the cockpit issue name who answered.
- Given an expired, revoked or used invitation, then no account is created.
- Given the owner removes a teammate, then their next request is refused.

### FR-17: Health and deploy state
Acceptance:
- Given a project whose observability backend reports it unhealthy, then the overview and its page show the
  health and the project status becomes broken.
- Given a project with a deploy workflow, then its page shows the version in production and whether the last
  deploy and its verification passed.
- Given a project without either source, then nothing extra shows and its status is computed as before.
- Given a source fails to answer, then that value shows as unknown with the reason and the scan continues.

## Non-functional requirements
- NFR-1: The inbox and the overview open in under 1 second at the 95th percentile for 30 projects and 200
  entries, on a desktop on a normal connection.
- NFR-2: A full scan of 30 projects completes in under 2 minutes and uses under 20% of the forge's hourly request
  limit at the default interval.
- NFR-3: The inbox works on a 390 px wide phone screen: no horizontal scroll, touch targets at least 44 px.
- NFR-4: Every screen meets WCAG 2.2 AA in light and dark mode.
- NFR-5: COCKPIT's forge access is limited to the watched repositories and the permissions Metadata: read,
  Contents: read, Issues: read and write, Pull requests: read, Actions: read; the documentation lists them and why.
- NFR-6: Secrets (forge access, database, mail) never appear in logs, pages, issues or errors.
- NFR-7: Toward watched repositories COCKPIT makes no write other than creating cockpit issues; a test fails
  on any other writing request.
- NFR-8: Everything in the repository is generic: no real person, company, client or project; fixtures are
  fictional.

## Success metrics
| Metric | Baseline | Target | How measured | When checked |
|---|---|---|---|---|
| Share of cockpit issues created from COCKPIT | 0% (no COCKPIT) | ≥ 80% | issues labelled `cockpit` in watched repositories, with COCKPIT's marker | four weeks after the first deployment |
| Median time from entry `since` to answer | unknown (OQ-3) | < 24 h | COCKPIT's answer history | four weeks after the first deployment |
| Repositories opened just to find what waits | several times a day (brief) | none in a normal week | owner's self-report | four weeks after the first deployment |

### Guardrails
- Writes to watched repositories other than cockpit issues: 0.
- Entries answered twice: 0.
- Forge requests per hour: under 20% of the limit.
- Projects shown with a wrong status against `portfolio --json`: 0 in the acceptance fixtures.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| The state contract changes (schema version 2) | medium | high | read through the published schema; refuse unknown versions visibly per project |
| A watched project still writes the old state schema (no entry ids) | medium | medium | the project shows "state too old" with the regenerate step; nothing is guessed |
| Forge limits or outages | low | medium | per-project failure isolation, back-off on `Retry-After` (FR-3) |
| The forge access is broader than COCKPIT needs | medium | high | fine-grained access to the watched repositories only, NFR-5 and NFR-7 tests |
| Cockpit issues are not acted on because the label is missing | low | medium | FR-5 refuses without the label and says so |

## Out of scope
- Editing roadmaps, merging, releasing or commenting in watched repositories — never.
- Forges other than GitHub — later, if a watched project moves.
- Webhooks and real-time push — later, if a scan interval proves too slow.
- Per-project visibility within a team — later, after FR-16.
- Charts and history trends — never, unless a question needs one.

## Open questions
- OQ-1: Which domain and which of the owner's servers host the first deployment? → owner → before FR-9's
  deployment → blocking: no (blocks only the deploy step, not the build).
- OQ-2: How many slices does the owner fund (appetite)? → answered 2026-11-20: all of them ("all in").
- OQ-3: How long does one manual review take today, and how often? → owner → before the four-week check →
  blocking: no.

## Changelog
- v1 2026-11-20: first version from shape-notes session 1.
- v2 2026-11-20: the owner funds every slice (OQ-2 answered); acceptance written for FR-10 to FR-17; FR-16
  no longer waits for SOFTURE/AI#1406 (invitations released in `@softure-ai/auth` 0.2.20); the doctor status is
  read from the forge (`@softure-ai/skills` 0.23.0).
- v3 2026-11-20: entries are matched by their stable id and answers name it in the cockpit issue; the doctor's
  failure codes come from the forge; both from `@softure-ai/skills` 0.24.0 (SOFTURE/SKILLS#48 closed).

## Decisions (auto)
- Input check 6/6 (problem with evidence, primary person, first flow, core rule, no-gos, success signal with a
  threshold) → write the PRD.
- Status `accepted` instead of `draft` → the owner's brief of 2026-11-20 asks to decide everything and record it;
  no `must` FR carries a `TODO:`.
- Challenge round → every `must` FR stands as written; the counter-arguments are recorded under each FR.
- Leak lint → technology names kept only in the Module column and in the forge-permission NFR, which the brief
  requires ("Show which scopes are needed"); `cockpit`, `state.json` and `owner_queue` are the published
  contract names the product reads, not implementation choices.
- FR-10 to FR-17 → acceptance deferred to their slices: they are later releases in the brief, and the roadmap
  keeps them blocked until the owner funds them.
- Forward notes for the plan (not requirements): Next.js on Node 22, PostgreSQL, the `@softure-ai/*` modules;
  a fine-grained personal access token first, a GitHub App later for teams; doctor read from a sparse checkout
  until SOFTURE/SKILLS#48; REST only.
- v2: FR-10 to FR-17 → acceptance written now that every slice is funded; each keeps the empty case, the failure
  case and read-only toward watched repositories except cockpit issues.
- v2: doctor status (FR-7, FR-11) → read from the check run `context-doctor` on the main branch's head
  (`@softure-ai/skills` 0.23.0 closes that part of SOFTURE/SKILLS#48), so no checkout and no python3 at runtime;
  `missing` shows for a project whose CI has no such job yet. Stable entry ids and a machine-readable cockpit
  body (the rest of SOFTURE/SKILLS#48) are still open, so COCKPIT keeps its own fingerprint.
- v3: entry identity (FR-5, FR-6) → the stable `owner_queue[].id` and the cockpit marker of
  `@softure-ai/skills` 0.24.0 replace COCKPIT's own fingerprint; a project on the old schema shows "state too
  old" instead of being guessed at. Doctor failure codes (FR-7, FR-11) come from the `context-doctor` check run's
  annotations.
