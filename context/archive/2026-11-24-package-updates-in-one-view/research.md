# Research: package-updates-in-one-view

## How COCKPIT works today
- The scan (`src/scan/scan-projects.ts`) runs the optional adapters (`src/adapters/contract.ts`, FR-17) per project
  and stores each result in `adapters.reads` (`modules/adapters/reads.ts`): `value`, `absent` or `unknown` with a
  reason; a `rate_limited` read stops the scan. A new adapter needs no migration. The worker builds the adapters per
  scan run (`src/jobs/handlers.ts`), so a per-scan cache lives in the adapter's closure.
- Pattern to follow: the deploy adapter (`src/adapters/deploy/**`: state schema, read, view, loader, details) and
  the wake adapter (`read-wake.ts` reads `context/workflow.json` with `ForgeClient.getJsonFile`, raw JSON).
- An outside source beside the forge already exists: Grafana (`observability-adapter.ts`), with its base URL from
  the environment and a fetch that stops after the backend was unreachable once in a scan. The npm registry follows
  the same shape (`NPM_REGISTRY_URL`, default `https://registry.npmjs.org`), so the e2e points it at the fake forge.
- Pull requests: `src/forge/merges.ts` reads closed pulls; nothing reads a pull's head or its checks yet.
  Red checks with a fine-grained token: Actions runs of the head commit (`/actions/runs?head_sha=`) and the jobs of a
  failed run (`getRunJobs` in `src/forge/runs.ts`), as CMP-7 does (SOFTURE/SKILLS#68). Actions read is granted.
- Pages: `PageLayout` + `SectionCard` (`src/shell/**`), sidebar from `src/shell/navigation.ts` with icons in
  `src/shell/app-sidebar.tsx`; copy in `messages/en.ts` and `messages/pl.ts`; forge web links from
  `getForgeWebUrl(FORGE_API_URL)`.
- e2e: `e2e/fake-forge.ts` answers `/pulls` and `/actions/runs` per fixture (ignoring the query) and serves only
  `context/workflow.json` raw; `files` are served as a base64 envelope, which `getJsonFile` (raw) does not read.

## The routine's contract (`@softure-ai/skills` 0.35.0, `routines/package-updates.md`)
- Pull request title `chore(deps): bump SOFTURE packages (<YYYY-MM-DD>)`, branch `claude/bump-softure-<YYYY-MM-DD>`.
- Held packages: `context/workflow.json` → `routines.packageUpdates.hold`, entries `{ "package", "issue", "since" }`;
  the issue is written as `SOFTURE/AI#123` (owner/repo#N).

## Answers to the unknowns
- Key packages: every `@softure-ai/*` entry of `dependencies` and `devDependencies`; the five the roadmap names
  (skills, auth, deploy, mailing, mcp-access) first, the rest by name.
- Locked version: `package-lock.json` → `packages["node_modules/<name>"].version`; no lockfile reads as "not locked".
- npm: `GET <registry>/-/package/<name>/dist-tags` → `latest` (a few bytes, not the whole packument), once per
  package per scan (cached across projects); a failure is "newest unknown", never an older value (the read is
  replaced every scan).
- Red: only an open pull request is judged by its checks; a failed run at its head is red, named by its first failed
  job (one more read), else by the run's name.

## Decisions (auto)
- One always-on adapter `packages`; absent for a repository without `package.json` and without an update pull.
- Parts fail on their own: unreadable pulls → update "unknown"; unreadable workflow → held unknown; unreadable
  `package.json` → the whole read unknown (`manifest_unreadable`). A rate limit anywhere stops the scan.
- Issue links: `owner/repo#N` → the forge's web issue page; `#N` or `N` → the project's own issue; an https URL as is.

## Risks
- A renamed routine title shows "no update yet"; the branch prefix is the fallback (roadmap risk).
- Forge budget: up to five more reads per project per scan; NFR-2 stays far under the hourly budget.
