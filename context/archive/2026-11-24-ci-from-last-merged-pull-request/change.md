---
change_id: ci-from-last-merged-pull-request
title: "CI from the last merged pull request"
status: archived
branch: claude/project-thread-644pjn
roadmap_item: CT-7
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
a project with no CI run on its main branch shows the CI of its last merged pull request instead of "none": the result of the CI workflow's runs at that pull request's head, labelled "from PR #N" with a link, on the overview, the project page and the MCP overview; a project with runs on the main branch keeps showing those.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-7: CI from the last merged pull request
> - **Change ID:** `ci-from-last-merged-pull-request`
> - **Status:** ready
> - **Outcome:** a project with no CI run on its main branch shows the CI of its last merged pull request instead of
>   "none": the result of the CI workflow's runs at that pull request's head, labelled "from PR #N" with a link, on the
>   overview, the project page and the MCP overview; a project with runs on the main branch keeps showing those.
> - **Prerequisites:** —
> - **Touches (estimate):** `src/forge/runs.ts` (runs of a head commit, which workflow counts as CI), `src/forge/merges.ts`
>   (the last merged pull request), `src/scan/**` (one more read only when the main branch has no CI run),
>   `src/overview/**` (the CI cell and its label), `src/mcp/**` (the CI field gains its source), `messages/en.ts` and
>   `messages/pl.ts` (own keys).
> - **Size:** S
> - **Unknowns:**
>   - Which workflow is "CI" on a pull request: today only `ci.yml`; several watched projects run their checks as
>     `checks.yml` or `tests.yml`. Recommended: on the pull request, every workflow run at its head except the quality
>     review and the deploy, failed if any failed. (owner: research; blocks: no)
>   - Check runs need the Checks permission a fine-grained token lacks (SOFTURE/SKILLS#68): the Actions runs of the
>     head commit, as CMP-7 does. (owner: research; blocks: no)
> - **Risk:** a red pull request merged anyway shows red until the next merge; that is the truth, labelled.
> - **Baseline:** today six watched projects show CI "none" over MCP; after: a test on the fake forge with a project
>   whose checks run only on pull requests shows its last merged pull request's result and "from PR #N"; one with main
>   branch runs is unchanged.
> - **PRD refs:** F-7, FR-2, FR-3
> - **Input:** context/changes/ci-from-last-merged-pull-request/change.md

Findings gathered while recording it (2026-11-24):
- The overview's CI comes from `getMainBranchRuns` (`src/forge/runs.ts`): runs on the main branch with
  `exclude_pull_requests=true`, and `isCiRun` matches only `ci.yml`/`ci.yaml` or a run named `ci`.
- Over MCP on 2026-11-24 six watched projects show `ci: { kind: "none" }`: their checks run on pull requests only, and
  several name the workflow `checks.yml` or `tests.yml`.
- `src/forge/merges.ts` already reads merged pull requests (the deploy and package adapters use them).
- Check runs and annotations need the Checks permission a fine-grained token lacks (SOFTURE/SKILLS#68); Actions runs
  by `head_sha` work with Actions read.

## Constraints
- Owns exclusively (estimate): `src/forge/runs.ts`, `src/overview/**` (the CI cell); edits `src/scan/**` and the MCP
  overview answer (`src/mcp/**`) only for the CI field.
- Shared, append only: `messages/en.ts`, `messages/pl.ts`.
- No new permission; read-only toward watched repositories (NFR-7).
- No release, tag, publish or deploy without the owner's word.

## Notes
- Frame skipped: the owner asked for this exact behaviour (the last merged pull request's CI, labelled) and the
  research found no cheaper path.

## Done
CT-7 (`ci-from-last-merged-pull-request`): a project with no CI run on its main branch shows the CI of its last merged
pull request, labelled "from PR #N" with a link, on the overview, the history tab, the terminal and the MCP overview.
Commit b7717e0; evidence `cockpit/evidence/ci-from-last-merged-pull-request/`. Waiting: release.
