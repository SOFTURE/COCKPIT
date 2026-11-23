# Research: project-overview-with-status

## Question
What CMP-6 needs to show one row per project (status, active roadmap X/N and title, queued, open changes, waiting,
last release, last CI, last quality review, last read) and a status icon per project in the sidebar, from data the
scan already reads or can read cheaply.

## Today (master 62d8cdb)
- The scan (`src/scan/scan-projects.ts`) reads per project `context/state.json` and the owner-word issues, and stores
  them in `projects.reads` (last good state and issues kept on a failed read). No release, CI or quality-review data.
- `src/forge/client.ts`: read-only client with an internal `read(path, schema)`; no generic JSON read is exposed.
- `src/inbox/build-inbox.ts`: `buildInbox` flattens owner-queue entries and matches owner-word markers; it counts the
  unanswered entries (answer `open`). The status rule "waiting for you" needs exactly that count per project.
- Shell: `app/(app)/layout.tsx` passes `projects` to `AppSidebar`, whose `SidebarProject` already has an optional
  `statusIcon` slot (CMP-1). `/projects` (sidebar "Projects") is an empty placeholder page.
- `@softure-ai/theme-notion` exports `Status` (word + icon + colour), used by the scan screen.
- Tests: `tests/support/fake-forge-routes.ts` scripts the scan's forge answers; `fakeFetch` rejects unscripted calls
  and `expectAllUsed` fails on them, so new scan reads need routes in every scan test.

## The parity oracle: `portfolio.py` (`@softure-ai/skills` 0.24.0, `scripts/portfolio.py`, `--source api`)
- Active roadmap `slug done/total` (or `—` without one), queued = `len(queued)`, open changes = `len(open_changes)`,
  owner queue = `len(owner_queue)`.
- Last release: the forge's latest release (`repos/{slug}/releases/latest`: `tag_name`, `published_at[:10]`,
  source `release`), else `state.last_release` labelled `roadmap`. (The tag fallback exists only in git mode.)
- Doctor: the `context-doctor` check run (CMP-7); this item shows `n/a` (CMP-7's baseline).

## Unknown from the roadmap: which runs are CI and quality review
- `@softure-ai/quality-review` 0.3.0 ships `examples/quality-review.yml` (`name: quality-review`) and
  `examples/quality-review-matrix.yml` (`name: quality-review-packages`), run by `workflow_dispatch` on a branch the
  owner picks (the default branch by default).
- SOFTURE projects' CI is the workflow `ci` (`.github/workflows/ci.yml`, the job `context-doctor` lives there, as in
  this repository).
- `@softure-ai/ci-usage` runs are neither and must not count as CI.
- One call, `GET /repos/{o}/{n}/actions/runs?branch=<main>&per_page=100&exclude_pull_requests=true`, lists the newest
  runs of every workflow on the main branch: the newest completed run whose workflow file is `ci.yml`/`ci.yaml` (or
  named `ci`) is the last CI; the newest run whose workflow file or name starts with `quality-review` is the last
  quality review. The token already has Actions: read (CMP-2 probes `/actions/runs`).
- Decision: fixed names, not configurable (no project uses another name today; configuration can come when one does).

## Budget (NFR-2)
Two more GETs per project per scan (latest release, workflow runs): 4 per project, 120 per scan of 30 projects,
240 per hour at the default 30-minute interval, far under 20% of 5,000.

## Storage: "no migration (forge facts ride the scan document)"
`projects.reads` has `state` and `issues` jsonb only; putting forge facts into the stored state would mix COCKPIT's
data into the project's contract and lose them when the state read fails (the last good state is kept as a whole).
CMP-5 (PR #12, in flight) adds `projects` migration `0003`, so a `projects` migration here would collide.
Decision: a small module `overview` with its own schema and one table `overview.forge_facts` (one row per project,
FK to `projects.repositories` with cascade). Its migration sequence is its own, so nothing collides with CMP-5.
This departs from the roadmap's "no migration" wording but keeps its intent (no collision with lane A).

## Status rule (PRD, Business rules), first that applies
- broken: the latest read is not `ok` (or the project was never read), or the latest completed CI run on the main
  branch failed (`failure`, `timed_out`, `startup_failure`); the doctor (CMP-7) joins later.
- waiting for you: at least one unanswered entry (answer `open`, as the inbox counts it).
- stalled: open work and `updated_at` of the state older than 48 hours.
- moving: open work changed within 48 hours.
- idle: nothing open, nothing waiting.
Decision: "open work" = open roadmap items (`done < total`) or open changes, for both stalled and moving, so a
project with only open changes is never left without a status.

## Collisions with CMP-5 (PR #12)
Shared files: `src/forge/client.ts` (both add methods), `e2e/fake-forge.ts`, `messages/en.ts`,
`app/(app)/layout.tsx` (not touched by CMP-5), `context/foundation/roadmap.md`, `context/state.json`, and
`tests/support/memory-forge.ts` (CMP-5's `ForgeClient` fake must gain this item's new methods when the second of
the two merges). Expected; resolved at the back-merge.

## Framing
Skipped: the outcome is user-visible, the mechanism is cheap and research found no cheaper path or contradiction.
