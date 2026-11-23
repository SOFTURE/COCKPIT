# Research: project-page-history-and-doctor-findings

## Question
How CMP-10 shows on a project page the latest merges and releases, the latest CI and quality-review runs and the
doctor's findings with their codes and files (FR-11), with a block that shows its own failure while the rest loads,
and without breaking NFR-2.

## Today (master d5dedfd)
- `app/(app)/projects/[owner]/[name]/page.tsx` (CMP-9) renders the last good read of `context/state.json`; the
  roadmap's estimate `projects/[slug]/history/**` maps to `projects/[owner]/[name]/history`.
- The scan (`src/scan/forge-facts.ts`) reads per project and scan: `releases/latest`, one page of 100 main-branch
  workflow runs (`src/forge/runs.ts` `getMainBranchRuns`) and the doctor (`src/doctor/read-doctor.ts`): the
  `context-doctor` check run on the head, and on a failing run its annotations, of which only the summary
  annotation (`context-doctor failure codes`) is parsed. The overview stores only summaries (last CI, last quality
  review, latest release, doctor kind and codes) in `overview.forge_facts`.
- The doctor (`@softure-ai/skills` `doctor.py` `report_to_ci`) writes the summary annotation and then one annotation
  per failure, up to `CI_ANNOTATION_LIMIT = 9`: `file=<path>`, `title=<code>`, message = the finding. The forge's
  annotations API returns `path`, `title`, `message`, `start_line`.
- The check-runs API needs Checks: read, which a fine-grained token cannot hold (CMP-7, SOFTURE/SKILLS#68); the
  scan then falls back to the jobs of the head's runs, which give the status but no annotations.
- `src/projects/forge-access.ts` `getForgeClient` builds the client from `FORGE_TOKEN`; `null` when unset.
- The token's documented permissions include Pull requests: read (Settings copy, README), so merged pull requests
  can be listed (`GET /repos/{o}/{n}/pulls?state=closed&base=<branch>`), and releases with Contents: read
  (`GET /repos/{o}/{n}/releases`).
- The e2e fake forge (`e2e/fake-forge.ts`) answers `/pulls` with `[]` and has no `/releases` list route.

## Findings
- Read the history when the owner opens it, not in the scan: the scan's request count stays as it is (NFR-2 holds
  unchanged), the blocks are current, and each read's failure is that block's own reason (FR-11). Cost per open:
  pulls 1, releases 1, runs 1, doctor 1-2 requests, far below the forge's hourly budget.
- Merges: closed pull requests on the main branch, newest updated first (`per_page=50`), keep the merged ones,
  sort by `merged_at`, take 10. A month of closed-unmerged pull requests could push some merges past the page;
  accepted (the block says "latest").
- Releases: `per_page=10`, drop drafts (no `published_at`), take 5; a prerelease is marked.
- Runs: from the same runs read, the latest five CI runs and the latest five quality-review runs with their result
  (`summarizeRun`) and date.
- Doctor findings: the newest `context-doctor` check run; failing → its annotations, the summary one dropped, each
  other one a finding (code = title, file = path, message); the summary's counts give the total so the block can
  say how many findings the forge did not list (limit 9). Passing, pending or missing → said so. Check runs refused
  → the block names the refusal and the Checks permission.
- `src/forge/runs.ts` `CheckAnnotation` gains `path` (optional in the answer); `read-doctor.ts` is unaffected.
- No migration, no new write (`tests/forge/no-other-writes.test.ts` keeps guarding it), no SOFTURE package gap.

## Risks
- `messages/en.ts` is shared with parallel threads (CMP-12, 14, 19, 21): add one `projectHistory` namespace and one
  key `projectPage.openHistory`.
- E2E shares one database; the history spec reuses the project page's own fake repositories plus one new one.
