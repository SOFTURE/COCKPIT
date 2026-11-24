# Research: ci-from-last-merged-pull-request

## How it works today
- The scan's forge step (`src/scan/forge-facts.ts`) reads the main branch's runs once
  (`getMainBranchRuns`, `exclude_pull_requests=true`) and stores `findLastCiRun` (newest completed run of `ci.yml`,
  `ci.yaml` or a run named `ci`) as `overview.forge_facts.ci_run` (jsonb `{ result, url, at }`).
- `src/overview/build-overview.ts` parses that jsonb defensively (`storedRunSchema`) into `OverviewRun`; no stored run
  and a readable answer is `{ kind: "none" }`. A failed CI marks the project broken.
- The overview chip (`src/overview/overview-row.tsx`) and the terminal (`cli/render-views.ts`) word it through
  `describeRun`; the MCP overview passes `row.ci` through (`src/mcp/answers.ts`); the CLI parses it with
  `cli/answer-schemas.ts` (zod object, unknown keys stripped).
- The project's history tab (`src/project-page/history/*`) reads merges, releases and main-branch runs on open and
  lists the latest CI runs; with none it says "No CI run on the main branch yet."
- `src/forge/merges.ts` lists merged pull requests (newest merge first) but drops the head commit.
- Runs at a commit: `/actions/runs?head_sha=` with Actions read; the packages adapter already uses it and the fake
  forge serves it (`headRuns`). Check runs need the Checks permission a fine-grained token lacks (SOFTURE/SKILLS#68).

## What the change touches
- `src/forge/merges.ts`: keep `head.sha` as `headSha`.
- `src/forge/runs.ts`: runs at a head commit, which of them count as a pull request's CI, and their combined result.
- `src/scan/forge-facts.ts`: when the main branch answer holds no CI run, read the last merge and its head runs.
- `src/overview/*`, `cli/*`, `src/mcp/answers.ts` (passes through): the run carries `pullRequest: { number, url }`.
- `src/project-page/history/*`: the same fallback on the history tab.
- `messages/en.ts`, `messages/pl.ts`: own keys.
- No migration: `ci_run` is jsonb, the new field rides inside it; old rows parse without it.

## Risks
- A pull request's head runs include every workflow triggered there. Counting only `ci.yml` would miss the watched
  projects that name their checks `checks.yml` or `tests.yml`, so every completed run at the head counts except the
  quality review and the deploy; the newest run per workflow decides (reruns), failed if any failed.
- One more read per scan, only for projects with no CI on the main branch (two reads: pulls, head runs).

## Decisions (auto)
- "The project page" is read as the project's history tab, the only page part that shows CI today.
