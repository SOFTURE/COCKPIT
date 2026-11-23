# Research: deploy-state-adapter

## Question
How CMP-22 shows, for a watched project with a deploy workflow, which version runs in production and whether the
last deploy and its verification passed (FR-17, second acceptance), through the adapter contract CMP-21 set, with no
access to servers and nothing extra for projects without a deploy workflow.

## Today (master e139a2f)
- `src/adapters/contract.ts`: a `ProjectAdapter` reads one fact per project during the scan and answers
  `value | absent | unknown | rate_limited`; the scan (`src/scan/scan-projects.ts`) stores every result in
  `adapters.reads` (module `adapters`, migration adapters/0001), one row per project and adapter id. The job handler
  (`src/jobs/handlers.ts`) passes the adapters; scan tests pass none, so a new adapter adds no call to them.
- The observability adapter shows its value on the project page as a self-contained `HealthDetails` section and in
  the overview row. The table already accepts any adapter id (`^[a-z][a-z0-9_]*$`), so no migration is needed.
- The scan's own run read (`src/forge/runs.ts`) lists runs of the main branch only (`branch=<main>`); a deploy run
  started by a published release runs on the tag, so it never appears there.

## How SOFTURE projects deploy (`@softure-ai/deploy` 0.7.8, README)
- `softure-deploy init` writes `.github/workflows/deploy.yml` (both the server and the Cloudflare templates use that
  name). It runs on `release: published` (the run's `head_branch` is the tag) and on `workflow_dispatch` with an
  input `tag` (the run's `head_branch` is the branch it was started from; the tag is not in the runs API).
- The deploy job verifies the release (health route, `softure-deploy verify`, optional smoke check of the build
  info); a failed verify fails the run.
- The release report (`deploy-report.yml`, `softure-deploy release-report`) writes into the tag's GitHub Release body,
  between `<!-- softure-deploy:deployments -->` markers, a `## Deployments` table: one row per run, newest on top,
  columns When (UTC) `YYYY-MM-DD HH:MM`, Result (`✅ deployed` or `❌ failed at <step>`, other job results by icon),
  Environment, Image, Database, Verify (job result by icon), Run (`[run](<run url>)`). Cells are reduced to plain
  characters, so a `|` never appears inside one. The renderer is not exported by the package; a body produced by its
  CLI (`npx softure-deploy release-report`) is the test fixture.
- An app without the report job (COCKPIT's own deploy.yml has none) still has its runs.

## Reads (all within NFR-5's token: Actions read, Contents read)
- `GET /repos/{o}/{n}/actions/workflows/deploy.yml/runs?per_page=20`: 404 = no deploy workflow → `absent`, nothing
  shows. An empty list = never deployed → `absent` too (nothing to show yet).
- Only then `GET /repos/{o}/{n}/releases?per_page=20` (bodies included): the deployment rows of every release.
- Extra forge cost: one call per project per scan, two for projects with a deploy workflow (NFR-2 stays far away).

## What is shown
- **In production:** the newest `deployed` row of environment `production` across the release reports, or, without
  reports, the newest successful run started by a release (its tag). None → "not known".
- **Last deploy:** the newest run of the deploy workflow: running, passed, failed or cancelled, with its link and
  time; its version and verify result come from its report row (matched by run id) or, for a release run, its tag.
  A failed step named by the server (`failed at migrate`) is shown.
- No status change: FR-8 lists no deploy reason for broken, and FR-17 only asks the page to show it. The overview row
  and the digest stay as they are.

## Risks
- The report format is the package's; parsed by icons and positions, a row that does not match is skipped (the runs
  still answer). Tested against a body the package's own CLI wrote.
