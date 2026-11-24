---
project: "COCKPIT"
roadmap: cockpit-v3
version: 2
status: ready
prd_version: 3
updated: 2026-11-24
---

# Roadmap cockpit-v3: COCKPIT shows what the nightly routine and the next deploy need

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: no (owner, 2026-11-24: "release still waits for my word")
> - Parallelism: up to 4 at once
> - Owner at the keyboard: none
> - Source: the owner's feedback of 2026-11-24 after two days of running the whole portfolio from COCKPIT
>   (F-1 to F-4 below), not a PRD revision
> - Start: the owner asked for this roadmap and one thread per item after it merges (2026-11-24)

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CT-1** | `package-updates-in-one-view` | one page shows, per project, the last nightly package-update pull request, the held packages with their issue, and the key `@softure-ai` versions against the newest on npm | — | autonomous | done |
| **CT-2** | `app-shows-what-waits-for-deploy` | one page shows, per app, the last release and deploy, the merged changes since that release, and the required secrets added since the last deploy, so a deploy that would stop at the secret check shows before it runs | — | autonomous | done |
| **CT-3** | `context-drift-against-forge-flagged` | a project whose forge has a release newer than its `waiting: release` rows, or whose finished roadmap is still live, is flagged on the overview and its project page | CT-5 | autonomous | done |
| **CT-4** | `routine-owner-steps-answered-in-inbox` | owner steps the nightly routine records (held packages, new secrets) arrive in the inbox and the owner settles each with a "done" answer | — | autonomous | done_code (2026-11-24; waiting: release) |
| **CT-5** | `project-page-sections-as-tabs` | the project page shows its sections as tabs with icons and counters (for example "Waiting 5", "Roadmaps 1") instead of stacked boxes, built with the same tab bar as the rest of the SOFTURE apps | — | autonomous | done |

## Order

**Feedback points (no PRD FR yet), owner, 2026-11-24:**
- F-1: "Nightly package updates in one view: per project the last package-update pull request (date, merged or
  red), held packages with their issue, and the versions of the key @softure-ai packages against the newest on npm."
- F-2: "What waits for a deploy: per app the last release and deploy, the number of merged changes since that
  release, and the required secrets added since the last deploy (from compose `${NAME:?}` lines against what the
  last deploy rendered), so a deploy that will stop at the secret check shows before it runs."
- F-3: "Context drift against the forge: flag a project whose forge has a release newer than its `waiting: release`
  rows, or whose done roadmap is still live."
- F-4: "Owner steps from the nightly routine (held packages, new secrets) as inbox entries with a 'done' answer;
  depends on SOFTURE/SKILLS#86, so it waits for that release."
- F-5 (owner, 2026-11-24 09:04 Warsaw, translated, with a screenshot of the project page's stacked "Waiting for
  you 5", "Active roadmap" and "Queued roadmaps 1" boxes): "add to the current roadmap that this view is in the form
  of tabs (with icons and these counters, as now: waiting 5, roadmaps 1); see how we do such tabs and do it
  identically on the project view; it will be more readable than these boxes".

**Optimising for:** fewer surprises when running many projects: what the nightly routine did and what the next
deploy needs are visible before the owner opens a project.
**First proof:** CT-2, because a deploy that stops at the secret check is the costliest surprise (cockpit-v2's own
release needed `SOFTURE_EMAIL_KEY_SECRET`, added by a package bump and found by hand).
**Main risk:** external: CT-4 waits for `@softure-ai/skills` to record the routine's owner steps (SOFTURE/SKILLS#86).
**Depth:** reads only (NFR-7 stays: the one write is still the owner-word issue); every new fact comes from the
forge or the public npm registry during the scan and is kept in the adapters' reads table.

**Sizes:** relative to each other, never hours or dates (`roadmap.sizes: true`). S: one phase, one surface, no
migration. M: two or three phases, or one migration. L: several phases with a new stack or a package seam and open
unknowns.

CT-5 (F-5) reshapes the project page that CT-3 adds a flag to, so CT-3 waits for it; CT-1, CT-2 and CT-5 run in
parallel; CT-4 starts once SOFTURE/SKILLS#86 is released and the
skills are bumped here. CT-2 is the north star (the item that proves the roadmap's value first); CT-1 and CT-3 run
beside it.

### Starting point (codebase, 2026-11-24)
- Optional adapters: present (`src/adapters/contract.ts`; deploy, observability and wake adapters store one row per
  project and adapter in `adapters.reads`, `modules/adapters/migrations/0001_create_reads.sql`), so a new fact needs
  no migration.
- Deploy state: present (`src/adapters/deploy/read-deploy.ts` reads `.github/workflows/deploy.yml` runs and the
  `softure-deploy` release report in GitHub Releases; shown on the project page only).
- Required secrets: each app's `docker/prod/docker-compose.yml` lists them as `${NAME:?}` and the deploy workflow
  renders exactly those names into `.env.prod` (COCKPIT's own file, header comment).
- Nightly package updates: `@softure-ai/skills` `routines/package-updates.md` (0.35.0): one pull request titled
  `chore(deps): bump SOFTURE packages (<YYYY-MM-DD>)` on branch `claude/bump-softure-<YYYY-MM-DD>`; held packages
  in `context/workflow.json` → `routines.packageUpdates.hold` as `{ "package", "issue", "since" }`.
- Context state: present (`src/state/state-schema.ts` reads each project's `context/state.json` schema 2; releases
  are read for the project history, `src/project-page/history/**`).
- Inbox and answers: present (`src/inbox/**`, `src/decisions/answer-entry.ts`, owner-word marker
  `src/inbox/owner-word-marker.ts`, answers `yes | no | later`).
- Tabs: `@softure-ai/theme-notion` (^0.31.0 here) exports `TabBar` (`dist/notion/TabBar.d.ts`: tabs as links, each
  with `key`, `label`, `href`, optional `icon` and `count`, `size: "default" | "touch"`), the SOFTURE tab pattern;
  COCKPIT does not use it yet. The project page (`app/(app)/projects/[owner]/[name]/page.tsx`) stacks
  `EntriesSection`, `RoadmapSection`, `QueuedSection`, `ChangesSection` and a production card (`HealthDetails`,
  `DeployDetails`) as `SectionCard`s.
- UI: one shared page layout (`src/shell/page-layout.tsx`) and the sidebar (`src/shell/navigation.ts`); copy in
  `messages/en.ts` and `messages/pl.ts`.

### Lanes
| Lane | Chain | Owns (estimate) | Note |
| --- | --- | --- | --- |
| A | CT-1 | `src/adapters/packages/**` (new), `app/(app)/packages/**` (new), `src/forge/pulls.ts` if a new read is needed | adds one sidebar entry and its own message keys |
| B | CT-2 | `src/adapters/deploy/**`, `app/(app)/deploys/**` (new) | adds one sidebar entry and its own message keys |
| C | CT-5 → CT-3 | `src/project-page/**`, `app/(app)/projects/[owner]/[name]/page.tsx`, `src/drift/**` (new), `src/overview/**` | both edit the project page, so CT-3 follows CT-5; CT-3 is the only item that may add a migration (`modules/overview/migrations/0003_*`), if the drift needs a stored fact |
| D | CT-4 | `src/inbox/**`, `src/decisions/**`, `src/state/**`, `package.json` (skills bump) | starts after SOFTURE/SKILLS#86 is released |

Shared files, append only: `src/shell/navigation.ts` (CT-1 and CT-2 each add one entry), `messages/en.ts` and
`messages/pl.ts` (every item adds only its own keys, in both). Merges are serial, so the second item rebases its one
line; no other file is shared.

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. What the next deploy needs** | CT-2 | 1 M |
| 2. Nightly packages and drift | CT-1, CT-3 | 1 S, 1 M |
| 3. Routine owner steps in the inbox | CT-4 | 1 S |
| 4. Project page in tabs | CT-5 | 1 S |

Deferred: reading which secrets are actually set in a repository's `production` environment (needs the
`Secrets: read` permission, beyond the token's least privilege); sending a digest mail about drift. Neither is an
item until the owner asks.

## Items

### CT-1: Nightly package updates in one view
- **Change ID:** `package-updates-in-one-view`
- **Status:** done
- **Outcome:** a Packages page lists every watched project with its last package-update pull request (date, and
  merged, open, or red with its failing check), its held packages with their issue links, and the version of each
  key `@softure-ai` package in its lockfile against the newest published on npm, behind ones marked; a project with no
  package-update pull request yet says so.
- **Prerequisites:** —
- **Touches (estimate):** `src/adapters/packages/**` (new adapter: pull requests by the routine's title or branch,
  `package.json` and `package-lock.json`, `context/workflow.json` → `routines.packageUpdates.hold`, npm registry
  versions), `app/(app)/packages/**` (new page), `src/shell/navigation.ts` (one entry), `messages/en.ts` and
  `messages/pl.ts` (own keys).
- **Size:** M
- **Unknowns:**
  - Which packages are "key": every `@softure-ai/*` dependency, or a short list (skills, auth, deploy, mailing,
    mcp-access)? Recommended: every `@softure-ai/*` entry, key ones first. (owner: research; blocks: no)
  - The npm registry is a new outside read: one request per package per scan, cached for the scan, and a failure
    shows "unknown", never a stale version. (owner: research; blocks: no)
  - How a red pull request is recognised with a fine-grained token that cannot read check runs (SOFTURE/SKILLS#68):
    the Actions runs of its head, as CMP-7 does. (owner: research; blocks: no)
- **Risk:** a project that renamed the routine's pull request title shows "no update yet"; the branch prefix is the
  fallback.
- **Baseline:** today the owner opens each repository's pull requests and `package.json`; after: a test with three
  fictional projects on the fake forge (one merged update, one red, one with a held package) and a fake registry
  shows the three states, the issue link and a behind version; the page passes the phone check at 390 px.
- **PRD refs:** F-1, FR-17, NFR-7
- **Input:** context/archive/2026-11-24-package-updates-in-one-view/change.md

### CT-2: Each app shows what waits for its deploy
- **Change ID:** `app-shows-what-waits-for-deploy`
- **Status:** done
- **Outcome:** a Deploys page lists every watched app with its last release and its last production deploy, the
  number of changes merged into the main branch since that release, and the required secrets added since the last
  deploy (names in `${NAME:?}` lines of its compose file on the main branch that the compose file at the deployed
  tag did not have); an app with new required secrets is marked "will stop at the secret check" before anyone runs
  the deploy; a project without a deploy workflow shows nothing.
- **Prerequisites:** —
- **Touches (estimate):** `src/adapters/deploy/**` (compare the main branch with the last release, read the compose
  file at both refs), `app/(app)/deploys/**` (new page), `src/shell/navigation.ts` (one entry), `messages/en.ts` and
  `messages/pl.ts` (own keys).
- **Size:** M
- **Unknowns:**
  - Where the compose file lives in every app: `docker/prod/docker-compose.yml` as `softure-deploy init` writes it,
    or a path named in `deploy.json`? (owner: research; blocks: no)
  - "Merged changes since the release": merge commits on the main branch since the release tag (the compare API) or
    archived change folders since then? Recommended: merged pull requests, counted with the compare API. (owner:
    research; blocks: no)
  - A secret the owner already set before the deploy still counts as "added": COCKPIT cannot read environment
    secrets with least privilege, so the page says "check it is set", not "missing". (owner: research; blocks: no)
- **Risk:** the deploy adapter grows from one read to three per project per scan; the forge rate limit must still
  stop the scan cleanly.
- **Baseline:** today a missing secret shows only when the deploy fails at the secret check (cockpit-v2 needed
  `SOFTURE_EMAIL_KEY_SECRET`, found by hand); after: a test with fictional apps on the fake forge (one up to date, one
  with three merged changes, one whose compose gained a `${NAME:?}` line) shows the count and the new secret's name;
  the page passes the phone check at 390 px.
- **PRD refs:** F-2, FR-17, NFR-7
- **Input:** context/archive/2026-11-24-app-shows-what-waits-for-deploy/change.md

### CT-3: Context drift against the forge is flagged
- **Change ID:** `context-drift-against-forge-flagged`
- **Status:** done
- **Outcome:** the overview and the project page flag a project whose forge has a release published after the
  rows its `context/state.json` still shows as `waiting: release` (the release was never settled into the context),
  or whose active roadmap has every row done and is still live instead of archived; the flag names which drift it
  is and what settles it (`wt-roadmap.py released <tag>`, or closing the roadmap).
- **Prerequisites:** CT-5 (the project page's tabs, where the flag sits)
- **Touches (estimate):** `src/drift/**` (new), `src/overview/**` (a flag on the row), `src/project-page/**` (a
  flag in the header), `src/state/state-schema.ts` (read only), `modules/overview/migrations/0003_*` (only if the
  latest release must be stored), `messages/en.ts` and `messages/pl.ts` (own keys).
- **Size:** S
- **Unknowns:**
  - What "release newer than the rows" compares: the newest release's `published_at` against each row's date in
    `done_code (<date>; waiting: release)`, or the release's commit against the rows' merge commits? Recommended:
    the dates, which `state.json` already carries. (owner: research; blocks: no)
  - Is a roadmap whose rows are all `done_code (waiting: release)` "done and still live"? Recommended: no, only when
    every row is `done`; waiting for a release is the normal state before the close. (owner: research; blocks: no)
- **Risk:** a false flag on every project right after a release, until its session settles the context; the flag
  says so instead of looking like an error.
- **Baseline:** today drift shows only when someone reads the roadmap against the releases; after: a test with
  fictional projects (settled, released but not settled, finished roadmap still live) shows two flags and one clean
  row.
- **PRD refs:** F-3, FR-7, FR-10
- **Input:** context/archive/2026-11-24-context-drift-against-forge-flagged/change.md

### CT-4: Routine owner steps are answered in the inbox
- **Change ID:** `routine-owner-steps-answered-in-inbox`
- **Status:** done_code (2026-11-24; waiting: release)
- **Outcome:** the owner steps the nightly package-update routine records (a held package waiting for the owner, a
  new secret a bump needs) appear in the inbox like any other entry, and the owner settles each with a "done" answer
  that becomes one owner-word issue the project acts on, as SOFTURE/SKILLS#86 defines it.
- **Prerequisites:** SOFTURE/SKILLS#86 released in `@softure-ai/skills` and the skills bumped here
- **Touches (estimate):** `src/inbox/**` (the "done" answer), `src/decisions/answer-entry.ts`,
  `src/inbox/owner-word-marker.ts` (the marker's answer), `src/state/**` (the new owner-queue entries),
  `package.json` (skills bump), `messages/en.ts` and `messages/pl.ts` (own keys).
- **Size:** S
- **Unknowns:**
  - How SOFTURE/SKILLS#86 records the routine's owner steps (a `## Before the next release` step, or an issue listed
    in `context/workflow.json`) and whether the owner-word marker gains a `done` answer (owner: research; blocks: yes).
- **Risk:** the answer's shape is decided outside this repository; building it before the release would guess it.
- **Baseline:** today a bump's new secret reaches the owner only by hand; after: a test with a fictional project
  whose state lists a routine owner step shows it in the inbox, answers "done" and finds one owner-word issue with
  the marker SOFTURE/SKILLS#86 defines.
- **PRD refs:** F-4, FR-4, FR-5
- **Input:** context/archive/2026-11-24-routine-owner-steps-answered-in-inbox/change.md

### CT-5: The project page shows its sections as tabs
- **Change ID:** `project-page-sections-as-tabs`
- **Status:** done
- **Outcome:** the project page shows its sections as one tab bar instead of stacked boxes: "Waiting" with the
  number of entries waiting for the owner, "Roadmaps" with the active and queued roadmaps and their number, "Changes"
  with the open changes and their number, and "Production" with health and deploy, each tab with an icon; the tab
  bar is the theme's `TabBar` (links, so a tab has its own address and the back button works), the same pattern as
  the other SOFTURE apps; the first tab with something in it opens by default; on a phone the tabs are touch-sized.
- **Prerequisites:** —
- **Touches (estimate):** `app/(app)/projects/[owner]/[name]/page.tsx` (the tab bar and the selected tab from the
  address), `src/project-page/**` (sections become tab panels, counters), `messages/en.ts` and `messages/pl.ts`
  (own keys).
- **Size:** S
- **Unknowns:**
  - Is `TabBar` of `@softure-ai/theme-notion` the pattern the owner means by "how we do such tabs"? Recommended:
    yes, it is the theme's tab component with icons and counters; a gap in it goes to SOFTURE/AI. (owner: research;
    blocks: no)
  - Which tabs and in what order: the four above, with the wake status staying above the tabs? (owner: research;
    blocks: no)
- **Risk:** an answer form inside the "Waiting" tab must keep working after a submit (the page reloads on the same
  tab); the e2e of CMP-5 and CMP-9 guard it.
- **Baseline:** today the page stacks four boxes (the owner's screenshot of 2026-11-24); after: e2e opens a
  fictional project with five entries and one queued roadmap, sees the tabs "Waiting 5" and "Roadmaps 1", switches
  tabs by link, answers an entry from the "Waiting" tab; screenshots at 1280 and 390 px, light and dark.
- **PRD refs:** F-5, FR-10
- **Input:** context/archive/2026-11-24-project-page-sections-as-tabs/change.md

## Owner decisions and checks

- [x] **CV-3**: set `APP_LOCALE` = `pl` as a *variable* (not a secret) in the `production` environment, then run the `deploy` workflow on `v2026.11.24` again; the v2026.11.24 deploy rendered only `APP_HOST` and `EDGE_NETWORK` as variables, so the panel still reads English (`<html lang="en">`, checked 2026-11-24) — done: v2026.11.24-2 (deploy run 45380690780; the deploy now reads APP_LOCALE as a secret too, PR #64; `<html lang="pl">` checked 2026-11-24)
- [ ] **CMP-12**: turn the digest on: in Resend verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY` and `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) and `DIGEST_RECIPIENTS` (`SOFTURE_EMAIL_KEY_SECRET` is already set), and the variables `MAIL_FROM` and optionally `DIGEST_AT`; after the following deploy the run checks the first digest and its unsubscribe link (README, "The digest in production"). Today these secrets are empty (deploy run 45375144586). (carried over from cockpit-v2)
- [ ] **CMP-20**: to invite teammates, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`; the invitation mail needs the digest's mail settings above (carried over from cockpit-v2)
- [ ] **CMP-18**: to publish the CLI, store a granular npm token (read and write on the `@softure-ai` scope) as `NPM_TOKEN` in the `npm` environment and give the word to publish `@softure-ai/cockpit` 0.7.0 (`publish-cli` has never run) (carried over from cockpit-v2)
- [ ] **CMP-21** (optional): to show health from observability, set the variable `GRAFANA_URL` and the secret `GRAFANA_TOKEN` (a Grafana service account that may read alert rules) in the `production` environment; today `GRAFANA_TOKEN` is empty (carried over from cockpit-v2)

## Done
- **CT-1** `package-updates-in-one-view`: a Packages page lists every watched Node project with its last package-update pull request (merged, open, closed, or red with its failing job), its held packages with issue links, and each `@softure-ai` package's locked version against the newest on npm, behind ones marked; a packages adapter reads them in the scan (no migration, no new permission); released: v2026.11.24; archived in `archive/2026-11-24-package-updates-in-one-view/`
- **CT-5** `project-page-sections-as-tabs`: the project page shows its sections as one tab bar with icons and counters (Waiting, Roadmaps, Changes, Production), the shown tab in the address; released: v2026.11.24; archived in `archive/2026-11-24-project-page-sections-as-tabs/`
- **CT-2** `app-shows-what-waits-for-deploy`: a Deploys page lists every app with a deploy workflow with its last release, production and last deploy, the pull requests merged since the release and the required secrets added since production, marked "will stop at the secret check"; released: v2026.11.24; archived in `archive/2026-11-24-app-shows-what-waits-for-deploy/`
- **CT-3** `context-drift-against-forge-flagged`: the overview and the project page flag a release not settled in the context and a finished roadmap still live, naming what settles each; released: v2026.11.24; archived in `archive/2026-11-24-context-drift-against-forge-flagged/`
- **CT-4** `routine-owner-steps-answered-in-inbox`: the owner steps and holds the package-update routine records show in the inbox; a step or secret is answered "Done" (marker `yes`, SOFTURE/SKILLS#86), and its owner-word issue says how to settle it (`confirmed` on an `ownerSteps` entry, the next run for a hold); waiting: release; archived in `archive/2026-11-24-routine-owner-steps-answered-in-inbox/`

## Decisions (auto)
- Existing roadmap → cockpit-v2 had every row `done_code (waiting: release)`, so it was closed first and archived as
  `foundation/archive/2026-11-24-roadmap.md` before its release (WORKFLOW §5.2); its open pre-release steps and the
  release word stay there.
- Source → the owner's feedback F-1 to F-4 of 2026-11-24 instead of a PRD revision (`--from-feedback`); every item
  stays inside NFR-7.
- Prefix → `CT` (cockpit three); `CMP` and `CV` stay with cockpit-v1 and cockpit-v2.
- Baseline → the code probes were used unconfirmed (autonomous mode).
- North star → CT-2, because a deploy stopped at the secret check is the costliest surprise the owner named.
- Storage → each new fact is an adapter read (`adapters.reads`, no migration); only CT-3 may add a migration.
- Pages → CT-1 and CT-2 get one page each across projects, as the owner asked for "one view" and "per app", instead
  of more chips on the overview.
- v2: F-5 (project page as tabs) → its own item CT-5 instead of growing CT-3; CT-3 follows it because both edit the
  project page; tabs from `@softure-ai/theme-notion` `TabBar`, the theme's own tab pattern.
- CT-4 → `blocked (SOFTURE/SKILLS#86)`: the entry and its "done" answer are defined there (owner: "it waits for that
  release").
- CT-4 unblocked 2026-11-24: SOFTURE/SKILLS#86 shipped in `@softure-ai/skills` 0.36.0 (already pinned). The marker keeps
  `yes`; COCKPIT words a step's or secret's yes as "Done".
