# Research: cli-release-ready

Read on master e2134c5 (CMP-17 merged), Node 22.23, npm 10.9, esbuild 0.28 as installed.

## How things are today
- CMP-17 added the `cockpit` command (`cli/`): `bin.ts` runs `runCli` with Node's own type stripping; `package.json`
  has `"bin": { "cockpit": "cli/bin.ts" }` and the script `cockpit`. It runs only from a checkout (README, Terminal).
- The root package `@softure-ai/cockpit` is `private: true` and is the whole app (Next, auth, db, ...): it cannot be
  published as it is, and installing it for a terminal command would pull the app's dependencies.
- The CLI imports, outside `cli/`: `messages/en.ts`, `messages/index.ts`, `src/mcp/tool-catalog.ts`,
  `src/projects/format-time.ts`, the moved screen helpers, and `zod`. No server-only module, no React.
- `CHANGELOG.md` lists 0.1.0 and 0.2.0 (unreleased); `package.json` is 0.2.0 on master. Open release pull requests
  claim 0.3.0 (CMP-16, CMP-20), 0.4.0 (CMP-11) and 0.5.0 (CMP-23); the version is taken at merge time.
- CI (`.github/workflows/ci.yml`): gates, e2e, deploy dry run, context doctor. No npm publish anywhere.
- The `release` workflow cuts date tags for the app; it is unrelated to npm.

## What the tools give
- `esbuild cli/bin.ts --bundle --platform=node --format=esm --target=node22` builds one file (about 780 KB, 475 KB
  minified; zod is most of it) that runs on plain Node: `--help` exits 0, no address exits 2. The entry's hashbang is
  kept.
- `npm publish <dir> --dry-run` packs and reports without credentials; a real publish needs a token with publish
  rights to the `@softure-ai` scope (`NODE_AUTH_TOKEN` through `actions/setup-node` `registry-url`) and
  `--access public` for a scoped package; `--provenance` needs `id-token: write`.
- `npm view @softure-ai/cockpit` answers 404 (2026-11-23): the name is free.

## Framing
`frame` skipped: the outcome is the packaging step the roadmap fixes (release notes, version, a publish dry run,
nothing published); no competing framing.

## Risks
- The package name: the root name `@softure-ai/cockpit` is reused for the published CLI instead of inventing a new
  name; creating it on npm happens only with the owner's word to publish (AGENTS.md: new `@softure-ai/*` packages and
  npm publishes on the owner's word).
- A bundle that works in the checkout but not after `npm install` (bin path, hashbang, missing file): the dry run
  installs the packed tarball into a scratch prefix and runs the installed `cockpit`.
- Version collisions with the other release items: merge the main branch in and take the next version at merge.
