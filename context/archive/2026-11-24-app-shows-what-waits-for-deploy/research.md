# Research: app-shows-what-waits-for-deploy

Read on master 6f74036.

## How it works today
- The deploy adapter (`src/adapters/deploy/read-deploy.ts`) reads per project and scan: the runs of
  `.github/workflows/deploy.yml` (20, newest first) and the releases (20, newest first), whose bodies carry the
  `softure-deploy release-report` deployments table (`release-report.ts`). It stores `DeployState`
  (`deploy-state.ts`): `production` (tag and time of the newest successful production deploy) and `last` (the
  newest run). A 404 on the runs means no deploy workflow (`absent`); a rate limit stops the scan.
- The stored read is shown only on the project page (`deploy-details.tsx`, `load-deploy.ts`, `deploy-view.ts`).
- Watched repositories come from `findRepositories` (`modules/projects/queries.ts`); stored adapter reads from
  `findAdapterReads` (`modules/adapters/reads.ts`). The scan stores the adapter value as JSON, so new fields need
  no migration; old stored values lack them and must still parse.
- Text files at a ref: `getTextFile` (`src/forge/text-file.ts`, contents API, base64).
- Navigation: `src/shell/navigation.ts` (keys and hrefs) and `src/shell/app-sidebar.tsx` (one icon per key, a typed
  record, so a new key needs its icon); copy in `messages/en.ts` and `messages/pl.ts` under `shell`.
- e2e: `e2e/fake-forge.ts` serves `deployRuns`, `releases` and `files` (contents by path, ref ignored); no compare
  route yet. Specs share one database, so fixtures use repository names no other spec uses.

## Answers to the unknowns
- **Compose path:** `softure-deploy env render` defaults to `--compose=docker/prod/docker-compose.yml`
  (`@softure-ai/deploy` README), and `init` writes the file there. `deploy.json` has no compose key. Read that path;
  a project without it shows no secret line.
- **Required names:** per the README every `${NAME:?…}` and `${NAME?…}` is required and `$${…}` is skipped;
  comments count too (the compose header says so). The parser follows exactly that.
- **Merged changes since the release:** the compare API `GET /repos/{o}/{r}/compare/{tag}...{branch}` lists the
  commits on the branch since the tag (up to 250) with `ahead_by`. GitHub merge commits ("Merge pull request #N")
  and squash commits ("Title (#N)") both name their pull request on the first line; COCKPIT's own merges end in
  `(#N)`. Count distinct pull request numbers; when the list is shorter than `ahead_by` the count is a lower bound.
- **Secrets already set:** environment secrets are not readable with least privilege, so the page says "check it is
  set", never "missing".
- **Last release:** the newest non-draft release in the releases page already read; no extra read.

## Reads per project
Runs and releases (today), plus compare, compose at the main branch and compose at the deployed tag: 5. Every extra
read passes a rate limit on so the scan stops cleanly; any other failure leaves only that fact unknown.

## Risks
- Stored values from earlier scans lack the new field: the schema makes it optional.
- The e2e omega fixtures get 404 for the new reads: their facts stay unknown, nothing else changes.
