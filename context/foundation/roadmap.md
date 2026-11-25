---
project: "COCKPIT"
roadmap: cockpit-v3
version: 7
status: ready
prd_version: 3
updated: 2026-11-25
---

# Roadmap cockpit-v3: COCKPIT shows what the nightly routine and the next deploy need

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: no (owner, 2026-11-24: "release still waits for my word")
> - Parallelism: up to 4 at once
> - Owner at the keyboard: none
> - Source: the owner's feedback of 2026-11-24 after two days of running the whole portfolio from COCKPIT
>   (F-1 to F-5 below), and the findings of reading COCKPIT over MCP the same day (F-6 to F-8), not a PRD revision
> - Start: the owner asked for this roadmap and one thread per item after it merges (2026-11-24)

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CT-1** | `package-updates-in-one-view` | one page shows, per project, the last nightly package-update pull request, the held packages with their issue, and the key `@softure-ai` versions against the newest on npm | — | autonomous | done |
| **CT-2** | `app-shows-what-waits-for-deploy` | one page shows, per app, the last release and deploy, the merged changes since that release, and the required secrets added since the last deploy, so a deploy that would stop at the secret check shows before it runs | — | autonomous | done |
| **CT-3** | `context-drift-against-forge-flagged` | a project whose forge has a release newer than its `waiting: release` rows, or whose finished roadmap is still live, is flagged on the overview and its project page | CT-5 | autonomous | done |
| **CT-4** | `routine-owner-steps-answered-in-inbox` | owner steps the nightly routine records (held packages, new secrets) arrive in the inbox and the owner settles each with a "done" answer | — | autonomous | done |
| **CT-5** | `project-page-sections-as-tabs` | the project page shows its sections as tabs with icons and counters (for example "Waiting 5", "Roadmaps 1") instead of stacked boxes, built with the same tab bar as the rest of the SOFTURE apps | — | autonomous | done |
| **CT-6** | `projects-of-several-forge-owners-watched` | COCKPIT reads each watched repository with the token of its owner, so the projects of an organisation and of a personal account are watched side by side | — | autonomous | done |
| **CT-7** | `ci-from-last-merged-pull-request` | a project whose checks run on pull requests only shows the CI of its last merged pull request, labelled as such, instead of "none" | — | autonomous | done |
| **CT-8** | `entries-keyed-by-project-and-id` | an owner-queue entry is told apart by project and id everywhere (answers, history, digest, the MCP `answer_entry`), so two projects with the same entry id never mix, proved by a test | — | autonomous | done |
| **CT-9** | `header-refresh-with-progress` | every screen has a header bar whose "Refresh" button scans every project and shows the live progress ("2 of 5 refreshed") and the last read time | — | autonomous | done |
| **CT-10** | `wake-projects-by-firing-routines` | right after COCKPIT opens a cockpit issue it fires the project's Claude Code routines over the routines API; each fire is recorded per issue with Retry, and the old wake concept and the older label and marker are gone | — | autonomous | done_code (waiting: release) |
| **CT-11** | `roadmap-item-status-above-action` | a roadmap item's status sits on top and its "Promote to work" under it, in the item's one bar that lights as one box on hover | — | autonomous | done_code (waiting: release) |
| **CT-12** | `routines-tab-dialogs-and-switch` | the Routines tab adds a routine and replaces a token in dialogs, explains fields with "?" tooltips, offers the kind from a list with a readable name, starts a routine enabled with an on/off switch, shows its state and last call as coloured marks, and keeps its controls on the right | CT-14 | autonomous | ready |
| **CT-13** | `fire-status-beside-send-state` | a fire reads only "Routine fired" or "No routine" next to "Sent", without the routine's name | CT-12 | autonomous | ready |
| **CT-14** | `delete-in-confirm-dialog` | deleting a sent broadcast asks in a confirmation dialog, and its trash can sits inside the row's box next to the arrow | — | autonomous | done_code (waiting: release) |
| **CT-15** | `recent-fires-as-list` | a project's "Recent fires" is a list of rows (issue number, title and the fire's date on the left, a green or red state badge on the right) covering the last two weeks | CT-13 | autonomous | ready |
| **CT-16** | `deletes-confirm-in-dialog-everywhere` | every delete, remove and revoke in COCKPIT (watched repositories, team members) asks in the one confirmation dialog CT-14 builds, its trash icon inside the row | CT-14 | autonomous | ready |
| **CT-17** | `field-hints-as-help-tooltips` | every hint under a form field or a setting's title (broadcast projects, add a repository, Settings rows, deploys and packages) becomes the "?" tooltip CT-12 builds | CT-12 | autonomous | ready |
| **CT-18** | `list-rows-one-shape` | one shared list row (identity left, state badge on top of the right column, actions under it, one hover box) and one result badge colour map, used on Broadcast, Scan status, Settings, Team and the Routines tab | CT-11, CT-15, CT-16, CT-21 | autonomous | ready |
| **CT-19** | `list-rows-one-shape-project-views` | the overview, inbox, project page, history tab, deploys and packages lists use the same row and result badge | CT-17, CT-18, CT-21 | autonomous | ready |
| **CT-20** | `routines-by-provider` | a routine has a provider: the add/edit form starts with a Provider choice (Claude Code only today) and shows that provider's fields; the call itself sits behind a provider adapter, and existing routines migrate to Claude Code | CT-12 | autonomous | ready |
| **CT-21** | `project-history-as-tabs` | a project's history shows CI, Quality review, Merges, Releases and Doctor as tabs with icons and counts, rows with a state icon each; one shared tab helper carries every multi-section screen (project page, inbox, history, Broadcast, Team) | — | autonomous | ready |

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

- F-6 (owner, 2026-11-24 11:55 Warsaw, finding 1 of reading COCKPIT over MCP, paraphrased): "Only 9 of 12
  projects are watched: the three of an organisation are missing, likely because the token covers the personal
  account only. Tell me exactly what token scope to add, then add the three repositories once I confirm."
- F-7 (finding 2): "CI shows 'none' for projects whose main checks run on pull requests only: fall back to the
  checks of the last merged pull request, labelled as such."
- F-9 (owner, 2026-11-24 13:28 Warsaw, translated, with a screenshot of Settings' "Refresh list"): "add a header
  with a menu, as in the trip planner, with the refresh button on its right and a nice loader while the projects
  refresh, since that happens asynchronously: 1 of 5 refreshed, 2 of 5 refreshed, and the last read time".
- F-10 to F-14 (owner, 2026-11-25 12:52 to 13:04 Warsaw, translated, each with a screenshot of the panel; thread
  "Collect visual fixes for the panel"):
  - F-10: "the status and Promote of a roadmap item are crooked: put Blocked on top and the Promote button under it,
    in one box, so the hover looks right".
  - F-11: "the field hints should be tooltips, a question mark by the field"; "a new routine is enabled by default,
    and an added routine has a switch to turn it off"; "Add routine is a popup from the Routines header, built with
    the Notion design components"; "Replace token sits by the other buttons and opens a popup"; "the buttons (Test,
    Disable, Delete) go on the right"; "a green icon by the name when enabled, orange when disabled"; "after a Test
    the Test button widened; a 200 should be a green badge (red on an error) beside the cockpit-issues badge"; "the
    predefined kinds come from a dropdown, not free text, which invites mistakes; for now one kind, shown as plain
    words saying what it is for; under the hood it can stay cockpit-issues".
  - F-12: "next to Sent it is enough to say the routine fired, or that there is none when the project has no
    routine".
  - F-13: "the trash can should sit at the arrow's level inside the same box, not outside it; delete through a popup".
  - F-14 (13:04): "lay Recent fires out nicely as a list, with nice green badges on the right and the number with the
    date it ran; show at most two weeks back".
- F-15 (owner, 2026-11-25 13:27 Warsaw, translated, thread "Shape app-wide UI standards roadmap"): "it must be a
  standing rule: now that we are stabilising, fix everything in a generic way; we have components, they must be used
  across the whole app, not only in the places I listed; verify it, open new items, don't do it inside one item".
- F-16 (owner, 2026-11-25 13:46 Warsaw, translated, with a screenshot of a routine row): "the routines we build now are
  tied to Claude, but in the end I want custom routines, not only Claude ones; the form must be generic, with a choice
  of provider, Claude now, maybe something else later".
- F-17 (owner, 2026-11-25 13:59 Warsaw, translated, with a screenshot of a project's history page): "the whole history
  view on tabs, with the right icons, and lay it out properly".
- F-8 (finding 4): "Entry ids repeat across projects ('start queued roadmap later' has the same id in two projects):
  make sure answers, history and the MCP answer_entry key on project + id, with a test."
- Finding 3 (an entry answered "later" still counted as unanswered) is not an item: it shipped in
  `deferred-entries-leave-waiting` (PR #62, released in v2026.11.24-3); see Decisions (auto).

**Optimising for:** fewer surprises when running many projects: what the nightly routine did and what the next
deploy needs are visible before the owner opens a project.
**First proof:** CT-2, because a deploy that stops at the secret check is the costliest surprise (cockpit-v2's own
release needed `SOFTURE_EMAIL_KEY_SECRET`, added by a package bump and found by hand).
**Main risk:** CT-6 needs a second forge token from the owner before the organisation's projects can be added.
**Depth:** reads only (NFR-7 stays: the one write is still the cockpit issue); every new fact comes from the
forge or the public npm registry during the scan and is kept in the adapters' reads table.

**Sizes:** relative to each other, never hours or dates (`roadmap.sizes: true`). S: one phase, one surface, no
migration. M: two or three phases, or one migration. L: several phases with a new stack or a package seam and open
unknowns.

CT-5 (F-5) reshapes the project page that CT-3 adds a flag to, so CT-3 waits for it; CT-1, CT-2 and CT-5 run in
parallel; CT-4 is ready: SOFTURE/SKILLS#86 is released in
`@softure-ai/skills` 0.36.0, which this repository already uses. CT-6, CT-7 and CT-8 (2026-11-24, from reading
COCKPIT over MCP) run in parallel with each other. CT-2 is the north star (the item that proves the roadmap's value first); CT-1 and CT-3 run
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
- Inbox and answers: present (`src/inbox/**`, `src/decisions/answer-entry.ts`, cockpit marker
  `src/inbox/answer-marker.ts`, answers `yes | no | later`).
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
| E | CT-6 | `src/projects/forge-access.ts`, `src/forge/client.ts`, `src/forge/repositories.ts`, every `getForgeClient()` caller (`src/scan/**`, `src/decisions/answer-entry.ts`, `src/project-page/load-project-page.ts`, `src/roadmap/load-roadmap-view.ts`, `src/adapters/**` loaders), `docker/prod/docker-compose.yml`, `.github/workflows/deploy.yml`, `README.md` | one new optional secret; touches `src/decisions/answer-entry.ts` only where it picks the client |
| F | CT-7 | `src/forge/runs.ts`, `src/forge/merges.ts`, `src/overview/**` (the CI cell), `src/scan/**` (one more read), `src/mcp/**` (the CI field of the overview answer) | |
| G | CT-8 | `src/inbox/build-inbox.ts`, `src/inbox/inbox-row.tsx`, `src/digest/compare-snapshots.ts`, `src/mcp/answer-tool.ts`, tests | starts after the ad-hoc inbox project-tabs change merges (both edit `src/inbox/**`) |
| H | CT-9 | `src/shell/app-shell.tsx`, `src/shell/refresh-control.tsx` (new), `src/scan/scan-projects.ts`, `src/scan/scan-handler.ts`, `src/scan/scan-progress.ts` (new), `app/api/scan-progress/**` (new), `app/(app)/layout.tsx` | CT-6 and CT-7 touch `src/scan/**` too: serial merges |

Shared files, append only: `src/shell/navigation.ts` (CT-1 and CT-2 each add one entry), `messages/en.ts` and
`messages/pl.ts` (every item adds only its own keys, in both). Merges are serial, so the second item rebases its one
line. CT-6 and CT-7 both touch `src/scan/**` (CT-6 only where the client is picked): serial merges, the second
merges the main branch in.

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. What the next deploy needs** | CT-2 | 1 M |
| 2. Nightly packages and drift | CT-1, CT-3 | 1 S, 1 M |
| 3. Routine owner steps in the inbox | CT-4 | 1 S |
| 4. Project page in tabs | CT-5 | 1 S |
| 5. Every project watched, read right | CT-6, CT-7, CT-8 | 1 M, 1 S, 1 S |
| 6. Refresh from every screen | CT-9 | 1 S |
| 7. Visual fixes the owner collected | CT-11, CT-14, CT-12, CT-13, CT-15 | 4 S, 1 M |
| 8. The fixes as app-wide standards | CT-16, CT-17, CT-18, CT-19 | 2 S, 2 M |
| 9. Routines beyond Claude | CT-20 | 1 M |
| 10. History in tabs, one tab pattern | CT-21 | 1 M |

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
- **Status:** done
- **Outcome:** the owner steps the nightly package-update routine records (a held package waiting for the owner, a
  new secret a bump needs) appear in the inbox like any other entry, and the owner settles each with a "done" answer
  that becomes one cockpit issue the project acts on, as SOFTURE/SKILLS#86 defines it.
- **Prerequisites:** SOFTURE/SKILLS#86 released in `@softure-ai/skills` and the skills bumped here (met: 0.36.0,
  already in `package.json`)
- **Touches (estimate):** `src/inbox/**` (the "done" answer), `src/decisions/answer-entry.ts`,
  `src/inbox/answer-marker.ts` (the marker's answer), `src/state/**` (the new owner-queue entries),
  `package.json` (skills bump), `messages/en.ts` and `messages/pl.ts` (own keys).
- **Size:** S
- **Unknowns:**
  - How SOFTURE/SKILLS#86 records the routine's owner steps (a `## Before the next release` step, or an issue listed
    in `context/workflow.json`) and whether the cockpit marker gains a `done` answer (owner: research; blocks: yes).
- **Risk:** the answer's shape is decided outside this repository; building it before the release would guess it.
- **Baseline:** today a bump's new secret reaches the owner only by hand; after: a test with a fictional project
  whose state lists a routine owner step shows it in the inbox, answers "done" and finds one cockpit issue with
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

### CT-6: Projects of several forge owners are watched
- **Change ID:** `projects-of-several-forge-owners-watched`
- **Status:** done
- **Outcome:** COCKPIT reads and answers each watched repository with a token that may read it: besides
  `FORGE_TOKEN` an optional secret `FORGE_EXTRA_TOKENS` carries more fine-grained tokens (one per resource owner,
  separated by whitespace); each repository uses the first token whose repository list holds it, Settings offers the
  repositories of every token, and a repository no token can read says which owner needs a token. With the
  organisation's token set, the organisation's repositories are added on Settings and every project is watched.
- **Prerequisites:** —
- **Touches (estimate):** `src/projects/forge-access.ts` (a client per repository instead of one), `src/forge/client.ts`,
  `src/forge/repositories.ts` (the union of the tokens' lists), the callers of `getForgeClient()` (`src/scan/**`,
  `src/decisions/answer-entry.ts`, `src/project-page/load-project-page.ts`, `src/roadmap/load-roadmap-view.ts`,
  `src/adapters/**` loaders, `src/projects/**`), `docker/prod/docker-compose.yml` and `.github/workflows/deploy.yml`
  (the optional secret), `README.md` (the forge token section), `messages/en.ts` and `messages/pl.ts` (own keys).
- **Size:** M
- **Unknowns:**
  - Which token reads a repository: the first whose `/user/repos` list holds it (cached as Settings' list is today),
    or a token named per owner (`OWNER=token`)? Recommended: the list, so the owner pastes tokens without naming
    owners. (owner: research; blocks: no)
  - A GitHub App installed on both owners would need no second token, but needs App authentication COCKPIT does not
    have; a gap in `@softure-ai/*` goes to SOFTURE/AI. (owner: research; blocks: no)
- **Risk:** a token whose list changes between scans moves a repository to another token; the scan must pick the
  client per read, never cache it per repository forever.
- **Baseline:** today one token with a personal resource owner reads 9 of 12 projects; the organisation's private
  repositories answer 404 to it. After: a test on the fake forge with two tokens, each listing one owner's repositories,
  scans both projects and creates a cockpit issue in each with its own token; after the owner step below and the
  next deploy, the overview over MCP lists every project.
- **Owner step:** see `## Owner decisions and checks` (CT-6).
- **PRD refs:** F-6, FR-1, NFR-5, NFR-7
- **Input:** context/archive/2026-11-24-projects-of-several-forge-owners-watched/change.md

### CT-7: CI from the last merged pull request
- **Change ID:** `ci-from-last-merged-pull-request`
- **Status:** done
- **Outcome:** a project with no CI run on its main branch shows the CI of its last merged pull request instead of
  "none": the result of the CI workflow's runs at that pull request's head, labelled "from PR #N" with a link, on the
  overview, the project page and the MCP overview; a project with runs on the main branch keeps showing those.
- **Prerequisites:** —
- **Touches (estimate):** `src/forge/runs.ts` (runs of a head commit, which workflow counts as CI), `src/forge/merges.ts`
  (the last merged pull request), `src/scan/**` (one more read only when the main branch has no CI run),
  `src/overview/**` (the CI cell and its label), `src/mcp/**` (the CI field gains its source), `messages/en.ts` and
  `messages/pl.ts` (own keys).
- **Size:** S
- **Unknowns:**
  - Which workflow is "CI" on a pull request: today only `ci.yml`; several watched projects run their checks as
    `checks.yml` or `tests.yml`. Recommended: on the pull request, every workflow run at its head except the quality
    review and the deploy, failed if any failed. (owner: research; blocks: no)
  - Check runs need the Checks permission a fine-grained token lacks (SOFTURE/SKILLS#68): the Actions runs of the
    head commit, as CMP-7 does. (owner: research; blocks: no)
- **Risk:** a red pull request merged anyway shows red until the next merge; that is the truth, labelled.
- **Baseline:** today six watched projects show CI "none" over MCP; after: a test on the fake forge with a project
  whose checks run only on pull requests shows its last merged pull request's result and "from PR #N"; one with main
  branch runs is unchanged.
- **PRD refs:** F-7, FR-2, FR-3
- **Input:** context/archive/2026-11-24-ci-from-last-merged-pull-request/change.md

### CT-8: Entries are told apart by project and id
- **Change ID:** `entries-keyed-by-project-and-id`
- **Status:** done
- **Outcome:** an owner-queue entry is identified by its project and its id everywhere: the stored answers (already
  `repository_key, entry_id`), the inbox rows and their history, the digest's new-entry comparison, the answer form
  and the MCP `answer_entry`; a test with two fictional projects whose queues carry the same id and text answers one
  and finds the other still open, with its own history and digest line.
- **Prerequisites:** — (starts after the ad-hoc inbox project-tabs change merges: both edit `src/inbox/**`)
- **Touches (estimate):** `src/inbox/build-inbox.ts`, `src/inbox/inbox-row.tsx` (`data-entry` names the project too),
  `src/digest/compare-snapshots.ts`, `src/mcp/answer-tool.ts`, tests under `tests/inbox/**`, `tests/digest/**`,
  `tests/mcp/**`.
- **Size:** S
- **Unknowns:**
  - Is anything keyed by id alone today? A first read found the answers table, the MCP tool and the inbox page keyed by
    project and id; `data-entry` on an inbox row and the digest comparison by id within a project. The change proves it
    with the test and fixes what fails. (owner: research; blocks: no)
- **Risk:** none beyond a test that finds a real mix-up.
- **Baseline:** today no test covers two projects with the same entry id (the same "start queued roadmap later" entry
  carries one id in two watched projects); after: that test passes.
- **PRD refs:** F-8, FR-4, FR-5, FR-6
- **Input:** context/archive/2026-11-24-entries-keyed-by-project-and-id/change.md

### CT-9: Refresh every project from a header bar, with live progress
- **Change ID:** `header-refresh-with-progress`
- **Status:** done
- **Outcome:** every screen has a header bar (the trip planner's top bar style: a bordered row, the menu button on a
  phone); on its right a "Refresh" button queues a scan of every watched project and, while it runs, a spinner, "N of
  M refreshed" and a progress bar count up live; when idle it shows the last read time; the page reloads its data when
  the scan ends.
- **Prerequisites:** —
- **Touches (estimate):** `src/shell/**`, `src/scan/**` (progress), `app/api/scan-progress/**` (new),
  `app/(app)/layout.tsx`, `messages/en.ts` and `messages/pl.ts` (own keys).
- **Size:** S
- **Unknowns:** none (the jobs package already stores a running job's progress).
- **Risk:** progress is written at most once a second, so a fast scan may skip counts; the end state is still right.
- **Baseline:** today a refresh of the projects is "Scan now" on Scan status, with no progress; after: an e2e presses
  "Refresh" in the header and sees the scan through to "Last read".
- **PRD refs:** F-9, FR-3
- **Input:** context/archive/2026-11-24-header-refresh-with-progress/change.md

### CT-10: Projects wake by COCKPIT firing their routines
- **Change ID:** `wake-projects-by-firing-routines`
- **Status:** done_code (waiting: release)
- **Outcome:** each project lists its Claude Code routines in its settings (name, kind `cockpit-issues`, trigger id,
  encrypted token shown only by its last four characters, enabled, Test); right after COCKPIT opens a cockpit issue
  (inbox answer, broadcast, promotion) it fires every enabled `cockpit-issues` routine of that project, records each
  fire on the issue (sent, failed with status and reason, queued, no routine) with Retry, and the overview's "wakes on
  its own" comes from that data only. The wake adapter, the older label and marker and every read of a
  project's wake declaration are removed (MVP: no fallback). Absorbs #90.
- **Prerequisites:** —
- **Touches (estimate):** `src/adapters/wake/**` (removed), `src/routines/**` (new), `modules/projects/**` (one
  migration), `src/forge/**`, `src/inbox/**`, `src/broadcast/**`, `src/decisions/**`, `src/roadmap/promote-roadmap.ts`,
  `src/overview/**`, `src/project-page/**`, `src/mcp/**`, `cli/**`, `e2e/**`, `README.md`, `messages/**`,
  `docker/prod/docker-compose.yml`.
- **Size:** L
- **Unknowns:** none blocking (the routines API shape is the owner's spec).
- **Risk:** a token in a log or an error; covered by redaction tests.
- **Baseline:** today a project wakes only if its own GitHub-triggered routine reacts to the label; after: unit tests
  and an e2e against a fake routines API show one fire per project per broadcast and a Retry that recovers.
- **PRD refs:** owner's spec of 2026-11-25 (thread "Wake projects by firing their routines"), NFR-7
- **Input:** context/archive/2026-11-25-wake-projects-by-firing-routines/change.md
- **Owner step:** see `## Owner decisions and checks` (CT-10).

### CT-11: A roadmap item's status above its Promote, in one box
- **Change ID:** `roadmap-item-status-above-action`
- **Status:** done_code (waiting: release)
- **Outcome:** on the roadmap view an item's status (for example "Blocked") sits at the top of the bar's right
  column and its "Promote to work" (or the issue it became) right under it, inside the item's bar, so the whole bar
  lights as one box on hover instead of a separate strip beside it.
- **Prerequisites:** —
- **Touches (estimate):** `src/roadmap/roadmap-view.tsx`, `e2e/promote.spec.ts`.
- **Size:** S
- **Unknowns:** none.
- **Risk:** a control inside a `<summary>` is a nested control; the action stays outside the summary, laid over it.
- **Baseline:** today the action sits beside the bar in its own strip (evidence `roadmap-item-status-above-action/01-item-row-before-3238-dark.webp`); after: an e2e checks the action lies inside the bar under the status.
- **PRD refs:** F-10
- **Input:** context/archive/2026-11-25-roadmap-item-status-above-action/change.md

### CT-14: Delete after a confirmation dialog, the trash can inside the row
- **Change ID:** `delete-in-confirm-dialog`
- **Status:** done_code (waiting: release)
- **Outcome:** a sent broadcast's trash can sits inside its row's box, after the arrow, and opens a confirmation
  dialog (Notion design `AlertDialog`) instead of an inline confirm; one shared delete-with-confirmation button that
  CT-12 reuses for routines.
- **Prerequisites:** —
- **Touches (estimate):** `src/shell/confirm-delete-button.tsx` (new), `src/broadcast/delete-broadcast-button.tsx`,
  `app/(app)/broadcast/page.tsx`, `e2e/broadcast.spec.ts`.
- **Size:** S
- **Unknowns:** none.
- **Risk:** none.
- **Baseline:** today the trash can stands outside the row and confirms inline (evidence `delete-in-confirm-dialog/01-history-row-before-3194-dark.webp`, `02-delete-confirm-before-970-dark.webp`); after: an e2e deletes through the dialog.
- **PRD refs:** F-13
- **Input:** context/archive/2026-11-25-delete-in-confirm-dialog/change.md

### CT-12: The Routines tab in dialogs, with a switch, marks and a kind list
- **Change ID:** `routines-tab-dialogs-and-switch`
- **Status:** ready
- **Outcome:** the Routines card's header has "Add routine", which opens the form in a dialog; field hints are "?"
  tooltips by the label; the kind is picked from a list that names it in words ("Wake on a new cockpit issue",
  stored as `cockpit-issues`) and the server accepts only listed kinds; a new routine starts enabled; each routine
  row shows a green or orange state icon by its name, its last call as a green or red badge beside the kind, and
  on the right an on/off switch, Test (no longer widened by its result), "Replace token" (a dialog) and Delete (the
  CT-14 confirmation dialog).
- **Prerequisites:** CT-14
- **Touches (estimate):** `src/routines/routine-forms.tsx`, `src/routines/routines-section.tsx`,
  `src/shell/field-help.tsx` (new), `modules/projects/routine-kinds.ts` (new), `modules/projects/routines.ts`,
  `src/routines/manage-routines.ts`, `app/(app)/routines/actions.ts`, `messages/**`, `tests/routines/**`,
  `e2e/routines.spec.ts`.
- **Size:** M
- **Unknowns:** none.
- **Risk:** a stored routine with a kind outside the list (none exist; only `cockpit-issues` was ever offered) still
  shows by its raw kind.
- **Baseline:** today free text fields, inline hints and a checkbox (evidence `routines-tab-dialogs-and-switch/01…07-*-before-*-dark.webp`); after: unit tests refuse an unlisted kind and an e2e adds a routine through the dialog and sees it enabled.
- **PRD refs:** F-11
- **Input:** context/changes/routines-tab-dialogs-and-switch/change.md

### CT-13: A fire reads only its state, next to "Sent"
- **Change ID:** `fire-status-beside-send-state`
- **Status:** ready
- **Outcome:** on a broadcast's page each project's fire reads "Routine fired", "No routine to fire" or the failure,
  on the same line as "Sent"; the routine's name moves to the tooltip, everywhere a fire shows.
- **Prerequisites:** CT-12
- **Touches (estimate):** `src/routines/wake-chip.tsx`, `app/(app)/broadcast/[id]/page.tsx`, `e2e/routines.spec.ts`.
- **Size:** S
- **Unknowns:** none.
- **Risk:** none.
- **Baseline:** today "<routine name>: Routine fired" on its own line (evidence `fire-status-beside-send-state/01-fire-line-before-1078-dark.webp`); after: an e2e reads the state beside "Sent".
- **PRD refs:** F-12
- **Input:** context/changes/fire-status-beside-send-state/change.md

### CT-15: Recent fires as a list, two weeks back
- **Change ID:** `recent-fires-as-list`
- **Status:** ready
- **Outcome:** a project's "Recent fires" card on the Routines tab lists one row per cockpit issue (the issue's
  number and title, and the date and time of its fire, on the left; a green badge for a fired routine, red for a
  failed fire, grey for no routine, on the right, with Retry where it applies), in the shared row style, and shows only
  fires of the last 14 days.
- **Prerequisites:** CT-13
- **Touches (estimate):** `src/routines/routines-section.tsx`, `src/routines/wake-chip.tsx`,
  `src/routines/load-routines.ts` or `src/routines/routines-tab.ts` (the 14-day window), `messages/**`,
  `tests/routines/**`, `e2e/routines.spec.ts`.
- **Size:** S
- **Unknowns:** none.
- **Risk:** none.
- **Baseline:** today a heading line per issue with the routine's name and state under it, with no date and no
  window (evidence `recent-fires-as-list/01-recent-fires-before-1708-dark.webp`); after: a unit test drops a fire
  older than 14 days and an e2e reads a row's number, date and badge.
- **PRD refs:** F-14
- **Input:** context/changes/recent-fires-as-list/change.md

### CT-16: Every delete, remove and revoke asks in one confirmation dialog
- **Change ID:** `deletes-confirm-in-dialog-everywhere`
- **Status:** ready
- **Outcome:** removing a watched repository on Settings and removing a member on Settings → Team go through CT-14's
  shared delete-with-confirmation dialog, with the trash icon inside the row's box on the right; no destructive control
  in COCKPIT's own code acts at once or confirms inline. The package-owned Revoke buttons follow by a bump when
  SOFTURE/AI#1469 (mcp-access tokens) and SOFTURE/AI#1470 (auth invitations) ship.
- **Prerequisites:** CT-14
- **Touches (estimate):** `src/projects/watched-repository-list.tsx`, `src/team/member-list.tsx`,
  `src/shell/confirm-delete-button.tsx` (one prop if needed), `messages/**`, `e2e/watched-repositories.spec.ts`,
  `e2e/team.spec.ts`.
- **Size:** S
- **Unknowns:** none.
- **Risk:** none.
- **Baseline:** today Remove acts at once and member removal is an inline `<details>`; after: e2e removes a
  repository and a member through the dialog, and a cancel keeps them.
- **PRD refs:** F-13, F-15
- **Input:** context/changes/deletes-confirm-in-dialog-everywhere/change.md

### CT-17: Field and setting hints as "?" tooltips everywhere
- **Change ID:** `field-hints-as-help-tooltips`
- **Status:** ready
- **Outcome:** the grey hint lines under the broadcast's projects, the add-a-repository picker, each Settings row's
  title, the deploys' new-secrets badge and the packages' "no update" badge become CT-12's "?" help tooltip beside the
  label, still the field's accessible description; card descriptions, results, errors, the confirmation line before a
  send and fix-it explanations stay visible text.
- **Prerequisites:** CT-12
- **Touches (estimate):** `src/broadcast/broadcast-form.tsx`, `src/projects/add-repository-form.tsx`,
  `src/settings/settings-row.tsx`, `src/adapters/deploy/deploys-list.tsx`, `src/adapters/packages/packages-details.tsx`,
  `src/shell/field-help.tsx` (reuse), `e2e/broadcast.spec.ts`, `e2e/settings.spec.ts`, `e2e/repository-picker.spec.ts`.
- **Size:** S
- **Unknowns:** none.
- **Risk:** the repository hint changes with the list's state; the tooltip must update with it.
- **Baseline:** today five inline hints (listed in the change); after: an e2e opens each "?" and reads its text, and
  the field still names it by `aria-describedby`.
- **PRD refs:** F-11, F-15
- **Input:** context/changes/field-hints-as-help-tooltips/change.md

### CT-18: One list row and one result badge
- **Change ID:** `list-rows-one-shape`
- **Status:** ready
- **Outcome:** a shared `ListRow` (identity left; right column with the state badge on top and the actions under it;
  one hover box in the shared inset when the row opens something; wraps on a phone) and a shared `ResultBadge` (one
  colour map: green done or fired, red failed, orange needs attention, grey none or pending, icon plus word) carry the
  Broadcast detail and history, Scan status, Settings' watched repositories, Team members and the Routines tab's
  routines and recent fires.
- **Prerequisites:** CT-11, CT-15, CT-16, CT-21
- **Touches (estimate):** `src/shell/list-row.tsx` (new), `src/shell/result-badge.tsx` (new), `src/broadcast/send-status.tsx`,
  `app/(app)/broadcast/[id]/page.tsx`, `app/(app)/broadcast/page.tsx`, `app/(app)/scan-status/page.tsx`,
  `src/projects/watched-repository-list.tsx`, `src/team/member-list.tsx`, `src/routines/routines-section.tsx`,
  `src/routines/wake-chip.tsx`, `tests/shell/**` (new), related e2e specs.
- **Size:** M
- **Unknowns:** whether `@softure-ai/theme-notion` already has a list row; if it has, use it, and if the gap is generic,
  file it in SOFTURE/AI. (owner: research; blocks: no)
- **Risk:** many e2e specs read these rows; their `data-*` selectors stay.
- **Baseline:** today each list lays out its own row and two primitives colour results differently; after: a unit test
  pins the colour map and an e2e reads the badge in the right column of each listed screen at 1280 and 390 px.
- **PRD refs:** F-10, F-11, F-13, F-14, F-15
- **Input:** context/changes/list-rows-one-shape/change.md

### CT-19: The project views use the one list row
- **Change ID:** `list-rows-one-shape-project-views`
- **Status:** ready
- **Outcome:** the overview, the inbox, the project page (roadmap items, changes, queued roadmaps), the history tab (CI
  runs, merges, releases, doctor findings), Deploys and Packages lay their rows out with CT-18's `ListRow` and
  `ResultBadge`; no list in COCKPIT keeps its own row layout.
- **Prerequisites:** CT-17, CT-18, CT-21
- **Touches (estimate):** `src/overview/overview-row.tsx`, `src/inbox/inbox-row.tsx`,
  `src/project-page/project-page-sections.tsx`, `src/project-page/history/history-sections.tsx`,
  `src/adapters/deploy/deploys-list.tsx`, `src/adapters/packages/packages-details.tsx`, related e2e specs.
- **Size:** M
- **Unknowns:** none.
- **Risk:** the overview row is the densest; on a phone its badges wrap under the name.
- **Baseline:** today six lists with their own layouts (listed in the change); after: a grep finds no list row outside
  `ListRow`, and the e2e of each screen passes at 1280 and 390 px.
- **PRD refs:** F-15
- **Input:** context/changes/list-rows-one-shape-project-views/change.md

### CT-20: Routines by provider, Claude Code the first
- **Change ID:** `routines-by-provider`
- **Status:** ready
- **Outcome:** a routine carries a provider; the add and edit dialog starts with a Provider list ("Claude Code", the
  only one today) and shows the fields that provider declares; firing, testing and reading the answer go through a
  provider adapter, while the fire queue, limits, fire records and Retry stay provider-neutral; every existing routine
  is migrated to Claude Code and keeps firing without a new token.
- **Prerequisites:** CT-12
- **Touches (estimate):** `modules/projects/migrations/0008_*` (new: provider column, existing rows to `claude-code`),
  `modules/projects/routines.ts`, `src/routines/providers/**` (new: the adapter contract and the Claude Code adapter
  from `routines-api.ts` and `trigger-id.ts`), `src/routines/manage-routines.ts`, `src/routines/fire-handler.ts`,
  `src/routines/routine-forms.tsx`, `app/(app)/routines/actions.ts`, `messages/**`, `tests/routines/**`,
  `e2e/routines.spec.ts`.
- **Size:** M
- **Unknowns:** provider settings as a JSON column with a schema per provider, or columns with a provider check.
  Recommended: a validated JSON column, so a new provider needs no migration. (owner: research; blocks: no)
- **Risk:** the migration touches stored routines; a test migrates a fixture routine and fires it. CT-13, CT-15 and
  CT-18 edit routines files too: serial merges, the later one merges the main branch in.
- **Baseline:** today the form, table and call are Claude-only (`0007_create_routines.sql`, `routines-api.ts`); after:
  a unit test fires through a fake second provider registered only in the test, and an e2e adds a Claude Code routine
  through the dialog's provider list.
- **PRD refs:** F-16
- **Input:** context/changes/routines-by-provider/change.md

### CT-21: Project history in tabs, one tab pattern app-wide
- **Change ID:** `project-history-as-tabs`
- **Status:** ready
- **Outcome:** a project's history page shows CI, Quality review, Merges, Releases and Doctor as tabs with icons and
  counts (the shown tab in the address), each row with its state icon and word, an empty tab saying so in one line; a
  shared tab helper over `TabBar` carries the project page, the inbox, the history, Broadcast ("New", "Sent N") and
  Settings → Team ("Members N", "Invite").
- **Prerequisites:** —
- **Touches (estimate):** `src/shell/page-tabs.tsx` (new), `app/(app)/projects/[owner]/[name]/history/page.tsx`,
  `src/project-page/history/history-sections.tsx`, `app/(app)/projects/[owner]/[name]/page.tsx`,
  `src/project-page/project-tabs.ts`, `app/(app)/inbox/page.tsx`, `app/(app)/broadcast/page.tsx`,
  `app/(app)/settings/team/page.tsx`, `messages/**`, `e2e/project-history.spec.ts`, `e2e/broadcast.spec.ts`,
  `e2e/team.spec.ts`, `e2e/project-page.spec.ts`, `e2e/inbox.spec.ts`.
- **Size:** M
- **Unknowns:** none.
- **Risk:** Broadcast and Team pages are also touched by CT-16 and CT-18, and the history sections by CT-19: those
  wait for CT-21 or merge the main branch in (serial merges).
- **Baseline:** today the history stacks four sections with an empty quality-review column (owner's screenshot); after:
  an e2e opens each history tab by its address and reads its rows and state icons, and the project page and inbox
  tabs read as before, at 1280 and 390 px.
- **PRD refs:** F-5, F-17
- **Input:** context/changes/project-history-as-tabs/change.md

## Owner decisions and checks

- [x] **CV-3**: set `APP_LOCALE` = `pl` as a *variable* (not a secret) in the `production` environment, then run the `deploy` workflow on `v2026.11.24` again; the v2026.11.24 deploy rendered only `APP_HOST` and `EDGE_NETWORK` as variables, so the panel still reads English (`<html lang="en">`, checked 2026-11-24) — done: v2026.11.24-2 (deploy run 45380690780; the deploy now reads APP_LOCALE as a secret too, PR #64; `<html lang="pl">` checked 2026-11-24)
- [x] **CT-6**: watch the organisation's projects: (1) in the organisation, Settings → Personal access tokens →
  Settings, allow fine-grained personal access tokens (approval on or off); (2) in your account, Settings → Developer
  settings → Fine-grained tokens → Generate new token: resource owner **the organisation**, repository access *Only select
  repositories*: the ones to watch, repository permissions **Contents: Read**, **Pull requests: Read**, **Actions:
  Read**, **Issues: Read and write** (Metadata: Read comes with them), nothing else; approve it under the
  organisation's *Pending requests* if approval is on; (3) store the token as the secret `FORGE_EXTRA_TOKENS` in this
  repository's `production` environment. A fine-grained token has one resource owner, so the existing `FORGE_TOKEN`
  (a personal account's) cannot be widened to the organisation. After CT-6 is released and deployed, the repositories are added
  on Settings. — done: the owner stored `FORGE_EXTRA_TOKENS` in `production` (2026-11-24 13:20 Warsaw); after the
  next deploy the run adds the organisation's repositories on Settings
- [ ] **CMP-12**: turn the digest on: in Resend verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY` and `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) and `DIGEST_RECIPIENTS` (`SOFTURE_EMAIL_KEY_SECRET` is already set), and the variables `MAIL_FROM` and optionally `DIGEST_AT`; after the following deploy the run checks the first digest and its unsubscribe link (README, "The digest in production"). Today these secrets are empty (deploy run 45375144586). (carried over from cockpit-v2)
- [ ] **CMP-20**: to invite teammates, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`; the invitation mail needs the digest's mail settings above (carried over from cockpit-v2)
- [ ] **CMP-18**: to publish the CLI, store a granular npm token (read and write on the `@softure-ai` scope) as `NPM_TOKEN` in the `npm` environment and give the word to publish `@softure-ai/cockpit` 0.7.0 (`publish-cli` has never run) (carried over from cockpit-v2)
- [ ] **CMP-21** (optional): to show health from observability, set the variable `GRAFANA_URL` and the secret `GRAFANA_TOKEN` (a Grafana service account that may read alert rules) in the `production` environment; today `GRAFANA_TOKEN` is empty (carried over from cockpit-v2)
- [ ] **CT-10**: before the release that carries CT-10, set the secret `ROUTINE_TOKEN_SECRET` (`openssl rand -base64 32`; never change it afterwards, or every stored routine token has to be pasted again) in the `production` environment; then, per project, set up its COCKPIT command routine (`routines/cockpit-command.md` of `@softure-ai/skills` 0.40), paste the fire URL and token on the project's Routines tab and press Test

## Done
- **CT-1** `package-updates-in-one-view`: a Packages page lists every watched Node project with its last package-update pull request (merged, open, closed, or red with its failing job), its held packages with issue links, and each `@softure-ai` package's locked version against the newest on npm, behind ones marked; a packages adapter reads them in the scan (no migration, no new permission); released: v2026.11.24; archived in `archive/2026-11-24-package-updates-in-one-view/`
- **CT-5** `project-page-sections-as-tabs`: the project page shows its sections as one tab bar with icons and counters (Waiting, Roadmaps, Changes, Production), the shown tab in the address; released: v2026.11.24; archived in `archive/2026-11-24-project-page-sections-as-tabs/`
- **CT-2** `app-shows-what-waits-for-deploy`: a Deploys page lists every app with a deploy workflow with its last release, production and last deploy, the pull requests merged since the release and the required secrets added since production, marked "will stop at the secret check"; released: v2026.11.24; archived in `archive/2026-11-24-app-shows-what-waits-for-deploy/`
- **CT-3** `context-drift-against-forge-flagged`: the overview and the project page flag a release not settled in the context and a finished roadmap still live, naming what settles each; released: v2026.11.24; archived in `archive/2026-11-24-context-drift-against-forge-flagged/`
- **CT-7** `ci-from-last-merged-pull-request`: a project with no CI run on its main branch shows the CI of its last merged pull request (every workflow at its head but the quality review and the deploy), labelled "from PR #N" with a link, on the overview, the history tab, the terminal and the MCP overview; released: v2026.11.24-4; archived in `archive/2026-11-24-ci-from-last-merged-pull-request/`
- **CT-4** `routine-owner-steps-answered-in-inbox`: the owner steps and holds the package-update routine records show in the inbox; a step or secret is answered "Done" (marker `yes`, SOFTURE/SKILLS#86), and its cockpit issue says how to settle it (`confirmed` on an `ownerSteps` entry, the next run for a hold); waiting: release; released: v2026.11.24-4; archived in `archive/2026-11-24-routine-owner-steps-answered-in-inbox/`
- **CT-8** `entries-keyed-by-project-and-id`: answers, the inbox rows and history, the digest and the MCP answer request are proved to key on project and id; an inbox row's `data-entry` names its project; released: v2026.11.24-4; archived in `archive/2026-11-24-entries-keyed-by-project-and-id/`
- **CT-9** `header-refresh-with-progress`: every screen has a header bar whose "Refresh" scans every project, counts "N of M refreshed" live with a progress bar and shows the last read time when idle; released: v2026.11.24-4; archived in `archive/2026-11-24-header-refresh-with-progress/`
- **CT-6** `projects-of-several-forge-owners-watched`: besides `FORGE_TOKEN` the optional secret `FORGE_EXTRA_TOKENS` (one fine-grained token per further resource owner, comma-separated) is read; each repository is read and answered with the first token that reads its metadata, Settings lists every token's repositories, and a repository no token finds names the owner that needs a token; the deploy passes the secret to app and worker as optional; waiting: release; released: v2026.11.24-4; archived in `archive/2026-11-24-projects-of-several-forge-owners-watched/`
- **CT-10** `wake-projects-by-firing-routines`: each project has a Routines tab (name, kind, trigger id or fire URL, encrypted token shown by its last four characters, enabled, Test); after every cockpit issue COCKPIT fires the project's enabled `cockpit-issues` routines with `COCKPIT command: <issue link>`, records each fire with Retry, queues over 30/h per routine and 100/h in all; the wake adapter and the older label and marker are gone; waiting: release; archived in `archive/2026-11-25-wake-projects-by-firing-routines/`
- **CT-11** `roadmap-item-status-above-action`: on a queued roadmap an item's status sits at the top of the bar's right column and its "Promote to work" (or the issue it became) right under it, inside the bar, which lights as one box on hover; the strip beside the bar is gone; waiting: release; archived in `archive/2026-11-25-roadmap-item-status-above-action/`
- **CT-14** `delete-in-confirm-dialog`: a sent broadcast's trash can sits inside its row's box after the arrow and opens a confirmation dialog saying its issues stay in the projects; one shared `ConfirmDeleteButton` for CT-12 to reuse; waiting: release; archived in `archive/2026-11-25-delete-in-confirm-dialog/`

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
- v3 (2026-11-24, the findings of reading COCKPIT over MCP): finding 3 ("later" entries counted as unanswered) is no
  item: `deferred-entries-leave-waiting` (PR #62, v2026.11.24-3) already shows them apart; checked over MCP on
  the watched project whose entry carries `(later: #N)`: `answer.kind = "deferred"`, `unanswered: 0`, covered by `tests/inbox/build-inbox.test.ts`.
- CT-6 → a second token per resource owner instead of a classic token with the `repo` scope (that would break least
  privilege) or a GitHub App (COCKPIT has no App authentication); the secret name `FORGE_EXTRA_TOKENS` is fixed here
  so the owner can store it before the change ships.
- CT-7 → the last merged pull request's head runs, as the owner asked, labelled with the pull request; no new
  permission (Actions read).
- CT-8 → its own item with a test, as the owner asked, even though the first read found the keys already right.
- CT-9 → the header's "Refresh" scans the projects (the owner's "while the projects refresh"); Settings' "Refresh
  list" keeps rereading the token's repository list. Progress comes from the jobs package's job progress, no migration.
- CT-4 → ready: SOFTURE/SKILLS#86 shipped in `@softure-ai/skills` 0.36.0 (installed); the routine's owner steps reach
  `owner_queue` (`ownerSteps` entries, owner holds, `## Before the next release` lines) and a "yes" cockpit answer
  confirms them (`routines/package-updates.md` §5), so the existing answers may suffice.
- CT-4 unblocked 2026-11-24: SOFTURE/SKILLS#86 shipped in `@softure-ai/skills` 0.36.0 (already pinned). The marker keeps
  `yes`; COCKPIT words a step's or secret's yes as "Done".
- v4 (2026-11-25, the owner's visual fixes F-10 to F-14): five items, one per screen area; CT-14 first because CT-12
  reuses its delete-with-confirmation button, and CT-13 after CT-12 because both edit `e2e/routines.spec.ts`; CT-15 after CT-13, the same files again. The
  "Add routine" button sits in the Routines card's header action slot, as every card action does. Evidence: the
  owner's screenshots, stored per change under `cockpit/evidence/<change-id>/`.
- v4: a draft of CT-11 to CT-14 made while the feedback came in is kept outside git, in the project files
  `cockpit/drafts/visual-fixes-draft.patch`, as input for the item threads (not a source of truth).
- v5 (2026-11-25, F-15, the owner's standing rule that every fix is an app-wide standard): an audit of master
  (8cf56ef) against CT-11 to CT-15 and #96 gives four items, one per standard: confirmation dialogs (CT-16), "?"
  tooltips (CT-17), and the list row with the result badge (CT-18, CT-19; one standard split by surface so the
  component lands once on the smaller screens before the project views). Each reuses the component its item builds
  (CT-14 `ConfirmDeleteButton`, CT-12 `FieldHelp`) and waits for it; CT-11 to CT-15 keep their scope.
- v5: no item for the green and orange enabled icon or for dropdowns instead of free text: the routine is the only
  thing in COCKPIT that can be enabled or disabled, and the routine kind the only predefined value typed by hand (the
  repository picker already lists suggestions; titles, bodies and answers are free text by nature); both are CT-12's.
- v5: the package-owned Revoke buttons (assistant tokens, team invitations) are SOFTURE/AI#1469 and #1470, filed
  instead of a local workaround; CT-16 does not wait for them.
- v6 (2026-11-25, F-16): routines by provider is its own item CT-20 after CT-12, which reworks the same form into a
  dialog; the provider is separate from CT-12's kind (what wakes a routine against how it is called); no second
  provider is built until the owner names one.
- v7 (2026-11-25, F-17): the history in tabs is CT-21, built as the app's one tab pattern (F-15) and applied to every
  screen that stacks several sections of equal weight (Broadcast, Team); Settings and Scan status stay single pages
  (a short first section, the rest one scroll away). CT-18 and CT-19 wait for CT-21 because they lay out the same rows.
