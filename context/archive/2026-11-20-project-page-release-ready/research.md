# Research: project-page-release-ready

Read on master a1f99fd (CMP-1 to CMP-10, CMP-12 to CMP-15 and CMP-21 merged).

## How things are today
- CMP-9 (PR #17) added the project page: roadmap items and stages, queued roadmaps, open changes, the owner's
  entries answered as in the inbox, and links into the repository derived from `FORGE_API_URL` (`src/forge/web-url.ts`).
- CMP-10 (PR #23) added the project page's history (recent merges, releases, CI and quality-review runs) and the
  doctor findings, read through the existing forge token.
- Neither item adds an environment name, a migration, a service or a dependency: `git diff 18683e6 a1f99fd` over
  `docker/`, `.github/`, `scripts/` and migration folders shows only CMP-12, CMP-13 and CMP-21 changes. The only
  `process.env` read in `src/` is `FORGE_API_URL`, which CMP-8 already passes.
- `CHANGELOG.md` has `0.2.0 (unreleased)` (digest) and `0.1.0 (unreleased)`; `package.json` is `0.2.0`.
- Open PR #27 (CMP-16, MCP release) takes `0.3.0`. Release items run in parallel, so this slice takes `0.4.0`; the
  version is re-checked against master before the merge.
- `scripts/deploy-dry-run.sh` (CI job `deploy-dry-run`) builds the image and brings the production stack up.
- No test reads the version or the changelog.

## Framing
`frame` skipped: a packaging step the roadmap fixes (version, notes, dry run); no competing framing.

## Risks
- A version collision with another release item merging first: re-check `package.json` on master before the merge.
