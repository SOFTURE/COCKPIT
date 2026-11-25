---
project: "COCKPIT"
session: 1
context_type: greenfield
created: 2026-11-20
updated: 2026-11-20
status: accepted
---

# Shape notes: one place to see every SOFTURE project and answer what waits for the owner

## Problem
A person who owns several autonomous SOFTURE projects reviews them by hand, "often several times a day". For
each repository they read the active and queued roadmaps, open changes, issues, pull requests, releases, CI and
quality-review runs, and `context/` hygiene. Out of all that they dig out the few decisions only they can make,
then write a prompt per project to act on each decision.

Evidence (the owner's brief, 2026-11-20):
> "the owner of seven autonomous projects reviews them by hand, often several times a day"
> "They lose track of what runs where."

Cost: the review is repeated per project and per day; a decision only reaches a project when someone writes a
prompt in that project's chat, so decisions wait while the projects idle on them. No measured time per review
exists yet (see Open questions).

## Who it is for
- Primary: the owner of several SOFTURE projects run in autonomous mode, who is the only person allowed to give
  release words, start queued roadmaps and answer owner decisions.
- Secondary (later): a small team (two to five people) sharing the same projects, each able to see and decide.
- Not for: people who do not use the SOFTURE workflow (no `context/state.json`), clients of the watched projects,
  the public.

## Access
Single owner first: one account, created by the operator, no public sign-up; without signing in nothing is
visible. The owner sees every watched project. Team members are a later slice: invited by the owner, same view,
each decision recorded with who made it. COCKPIT holds a least-privilege forge token for the watched
repositories; it reads them and its one write is creating cockpit issues.

## Today
- Open each repository on the forge and read the markdown under `context/` and the forge pages, project by
  project.
- `npx softure-skills portfolio` (WORKFLOW §12.3) prints one row per project and `--owner` prints the owner queue
  in a terminal, but it is read-only, desktop-only and offers no way to answer.
- To act on a decision: write a prompt in the project's chat, or open an `cockpit` issue by hand (§8.6).
- Doing nothing: decisions wait and projects idle until the next manual review.

## Why now
`context/state.json` (SOFTURE/SKILLS#27) and cockpit issues (SOFTURE/SKILLS#28) shipped in
`@softure-ai/skills` 0.20.0, so every project now exposes its state, and a decision has a written path back into
the project. The number of autonomous projects (seven) already exceeds what a manual review covers well.

## Appetite
UNKNOWN: the owner decides on 2026-11-21 how much to fund, from the roadmap's slices and sizes. The shape
assumes a first usable slice first (inbox and overview from real data, decisions as cockpit issues,
deployed), and later slices only after it is in use. Side work run by autonomous agents; no hard deadline.

## Solution sketch
First flow (the first usable slice):
1. The owner signs in on desktop or phone and lands on the decision inbox.
2. The inbox lists every `owner_queue` entry of every watched project, oldest first, with the project, the kind
   (word, decision, step, secret), the source and the age.
3. The owner answers one entry with Yes, No or Later, plus an optional note.
4. COCKPIT opens a cockpit issue in that project's repository; the entry shows "sent".
5. The project's coordinator acts on the issue and closes it; on the next scan the entry shows "done" and then
   leaves the inbox once the project's state no longer lists it.
6. The owner opens the overview: one row per project with its status and the numbers behind it.

Elements (not screens):
- Watched projects: a list of repositories kept as runtime configuration, never committed.
- Scan: reads each project's `context/state.json` from its main branch and the forge (open issues and pull
  requests, releases, workflow runs of CI, quality review and CI usage, cockpit issues), on a schedule (every
  15 to 60 minutes, configurable) and on demand.
- Decision inbox (value 1), overview (value 2), project page (3), mail digest only when something changed (4),
  MCP tools so the owner can ask and decide from a phone through an assistant (5), a CLI with the same read
  views (6). Optional adapters later: health from observability, deploy state.
- Look: Notion-style, from `@softure-ai/theme-notion` only. A left sidebar with the inbox (with its count) and the
  projects; database views as calm tables with grouped rows and property chips (status, kind, age); each project
  as a page; quiet type, no charts unless they answer a question; light and dark; desktop first, the inbox usable
  on a phone (390 px). The theme's own baseline "Sidebar" screen already shows this shell with an "Inbox 12"
  row.

Modules (WORKFLOW §10), checked against the published packages on 2026-11-20:
- sign-in, closed registration, first account by script, roles: use `@softure-ai/auth`;
- schedules that run once per period whatever the number of workers, on-demand runs: use `@softure-ai/jobs`;
- digest mail with idempotency and unsubscribe: use `@softure-ai/mailing`;
- MCP endpoint with scoped, hashed tokens and OAuth for assistants: use `@softure-ai/mcp-access`;
- rate limits, guarded outbound requests: use `@softure-ai/security`;
- database and migrations: use `@softure-ai/db`; app config, results, `requestJson` with `Link` paging and
  `Retry-After`: use `@softure-ai/core`;
- health endpoint: use `@softure-ai/ops`; logs, traces, metrics: use `@softure-ai/observability`;
- one-server deployment: use `@softure-ai/deploy` and `@softure-ai/host`;
- UI: use `@softure-ai/theme-notion` (with `@softure-ai/ui`'s bridge for package pages);
- lint, tsconfig, hooks, English-only gate: use `@softure-ai/config`; tests: use `@softure-ai/testing`;
- the state contract and the doctor: `@softure-ai/skills` (state schema, `doctor.py`, `portfolio.py`).
Gaps filed: SOFTURE/AI#1406 (invite a teammate while registration is closed: the teams slice),
SOFTURE/SKILLS#48 (stable owner-queue ids, a machine-readable cockpit body, doctor result without a checkout).

## Core rule
Every open owner-queue entry of every watched project is answered at most once: an answer becomes exactly one
cockpit issue in that project, the entry shows "sent" while that issue is open and "done" once it is closed,
and the entry leaves the inbox only when the project's own state stops listing it. (Shape: a ledger of
decisions keyed to entries of other systems' state.)

A project's status is computed from its state and the forge, in this order: **broken** (state unreadable, the
doctor fails, or the latest CI run on the main branch failed), **waiting for you** (at least one unanswered
owner-queue entry), **stalled** (open roadmap items but no change of state for longer than a threshold),
**moving** (open work that changed within the threshold), otherwise **idle**.

## Rabbit holes
- Reading markdown instead of `state.json` → cut: COCKPIT reads only the contract file and the forge; a project
  without `state.json` shows "no state yet" with a hint to update `@softure-ai/skills`.
- Running the doctor inside COCKPIT → time-box: one small reader of the packaged doctor on a sparse checkout of
  `context/`; switch to the forge check once SOFTURE/SKILLS#48 lands.
- GraphQL → cut: REST only, since GraphQL may be unavailable in some environments.
- Webhooks for instant refresh → cut from the first slices: schedule plus on-demand scan is enough.
- Editing roadmaps or merging from COCKPIT → cut for good: COCKPIT never writes to a watched repository except
  cockpit issues.
- Charts and trends → cut unless one answers a question the owner asks.
- Teams and per-project visibility → later slice, blocked on SOFTURE/AI#1406; the data keeps who decided from
  day one so teams do not change the meaning of history.
- Fingerprinting owner-queue entries → accept: COCKPIT fingerprints entries itself until SOFTURE/SKILLS#48 gives
  stable ids.

## No-gos
- No write to a watched repository other than creating cockpit issues: no comments, labels, closes, merges.
- No release, tag, npm publish or deploy from COCKPIT, and none of COCKPIT itself without the owner's word.
- No names of real people, companies, clients or projects in the repository; fixtures are fictional.
- No dashboard clutter: no charts, no colour without meaning, no emoji.
- No native mobile app; a phone-usable web inbox is enough.
- No GraphQL dependency; no other forge than GitHub in the first slices.

## Success signals
- The owner answers decisions from the inbox instead of reading repositories → at least 80% of cockpit issues
  in the watched projects created by COCKPIT within four weeks of the first deployment → counted on the forge
  (issues labelled `cockpit`, author and marker).
- Decisions reach projects faster → median time from an entry's `since` to its answer under 24 hours → from
  COCKPIT's decision ledger.
- The owner stops the per-repository review → self-reported: no repository opened just to find "what waits for
  me" during a normal week.
- Guardrails: zero writes to watched repositories other than cockpit issues; forge API use under 20% of the
  hourly limit; an entry is never answered twice.
- Scale: one owner, about seven projects today, room for about thirty.

## Open questions
- What domain does the first deployment use, on which of the owner's servers? → owner → before the first deploy
  (MVP release item).
- What does one manual review cost today (minutes per review, reviews per day)? → owner → before the success
  check; not blocking (accepted gap).
- Appetite: how many slices to fund → owner → 2026-11-21 (accepted gap).

## Forward notes
- Stack, decided for the first roadmap item: TypeScript, Next.js (App Router) on Node 22, PostgreSQL, the
  `@softure-ai/*` modules above; CI on GitHub-hosted runners (public repository).
- Forge token: a fine-grained personal access token limited to the watched repositories with Metadata: read,
  Contents: read, Issues: read and write, Pull requests: read, Actions: read. A GitHub App
  (`@softure-ai/connections/github-app`) is the later path when teams share one installation.
- Cockpit issue body: the entry quoted, its source and item, the answer and note, and a hidden marker with the
  entry fingerprint, matching SOFTURE/SKILLS#48 once it lands.
- `npx softure-skills portfolio --json` is the reference reader of the same data; COCKPIT's reader must agree
  with it on every column.

## Decisions (auto)
- Context type → greenfield (history holds only the bootstrap and two skills bumps; no lockfile beyond the
  skills package; no source folders).
- Status → `accepted` although the run is autonomous: the owner's brief of 2026-11-20 says "Decide everything
  yourself and record it under the artifacts' decisions", so the brief is the accepted input and every gap is
  recorded here or under Open questions.
- Access → single owner with a password account created by the operator script (`@softure-ai/auth`
  `create-account`, registration closed); GitHub sign-in is possible later but needs an OAuth App only the owner
  can create.
- Teams → a later slice, not day one; the decision ledger records who decided from the first slice.
- Public demo → none in the first slices; screenshots and fixtures use fictional projects.
- Watched repositories → kept in COCKPIT's database, edited by the owner on a settings screen; the token stays
  in the environment.
- Project status → a fifth value `idle` added to the brief's four, so a project with nothing in flight is not
  shown as stalled.
- "Later" answers → also become a cockpit issue ("later", with the note), so the project records it.
- Default scan interval → 30 minutes (inside the brief's 15 to 60), changeable in configuration.
- Doctor status → read by running the packaged doctor on a sparse checkout until SOFTURE/SKILLS#48 exposes it on
  the forge.
