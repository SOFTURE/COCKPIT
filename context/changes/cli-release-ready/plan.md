# Plan: cli-release-ready

## Goal
The CLI slice is ready to publish: the `cockpit` command is packed as a standalone npm package (one bundled file, no
runtime dependencies), a publish dry run is green in CI, the version and release notes list CMP-17, and a manual
`publish-cli` workflow publishes it only when the owner runs it. Nothing is published, tagged or released.

## Approach
**Chosen:** bundle `cli/bin.ts` with esbuild into `dist/cli-package/cockpit.mjs` and write a package manifest derived
from the root `package.json` (name, version, license, repository, engines) next to it, plus `README.md` and
`LICENSE`. The dry run packs it, runs `npm publish --dry-run`, installs the tarball into a scratch prefix and runs the
installed `cockpit`. Rejected: publishing the root package (private, the whole app); a workspace package with its own
sources (moves CMP-17's code for no gain).

**Key decisions:**
| Decision | Choice | Why |
| --- | --- | --- |
| Name | `@softure-ai/cockpit` (the repository's own name) | no new name; `npx @softure-ai/cockpit overview` reads naturally |
| Version | the root version (one version per slice); next after master at merge time | roadmap, lane R |
| Bundle | esbuild, ESM, node22, minified, zod inlined | no runtime dependencies to install or audit |
| Publish | `publish-cli.yml`, `workflow_dispatch` only, environment `npm`, secret `NPM_TOKEN`, `--provenance --access public`, refuses an already published version | nothing publishes without someone running it; the owner holds the token |
| Dry run in CI | job `cli-package` runs `scripts/cli-publish-dry-run.sh` | the roadmap's baseline: `npm publish --dry-run` green |

## Phase 1: Pack, dry run, publish workflow, version and notes
**Discipline:** TDD (the package test first). **Files:** `scripts/pack-cli.ts`, `scripts/cli-publish-dry-run.sh`,
`cli/README.md` (the package's readme), `tests/cli/cli-package.test.ts`, `e2e/cli.spec.ts`, `package.json`
(script `cli:pack`, version), `package-lock.json`, `.github/workflows/ci.yml` (job `cli-package`),
`.github/workflows/publish-cli.yml`, `CHANGELOG.md`, `README.md` (Terminal), `context/foundation/roadmap.md`.

**Tests:**
- `tests/cli/cli-package.test.ts`: the manifest carries the root's name, version, license, repository and engines,
  `bin.cockpit = cockpit.mjs`, only the packed files and no dependencies; the packed `cockpit.mjs` starts with the
  hashbang, `--help` exits 0 with the usage, no address exits 2 with the message and no stack, run with plain `node`
  outside the checkout.
- `e2e/cli.spec.ts`: the packed binary prints the same `overview --json` as `node cli/bin.ts` against the running
  app.
- `scripts/cli-publish-dry-run.sh`: pack, `npm publish --dry-run --access public`, `npm pack`, install the tarball
  into a scratch prefix, `cockpit --help` from the installed bin.

**Done when:**
- Automated: the package test passes; it fails when the manifest's `bin` is dropped (mutation checked).
- Automated: e2e passes after `npm run build` (packed binary equals the checkout's output).
- Automated: the dry-run script passes locally and in the `cli-package` job.
- Automated: gates green (typecheck, lint, test); `context-doctor` green.

## Risks and rollback
- The real publish needs the owner's word and an npm token: listed under `## Before the next release`.
- Rollback: revert the merge; nothing runs outside CI unless someone runs `publish-cli`.

## Decisions (auto)
- Package name, bundling and publish path as in the table above.
- CMP-21 health is not in the MCP answers, so the CLI cannot print it; it is outside CMP-18 (a release item) and is
  reported to the coordinator, not built here.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Pack, dry run, publish workflow, version and notes

#### Automated
- [ ] 1.1 Package test passes; dropping the manifest's `bin` turns it red
- [ ] 1.2 e2e: the packed binary prints the same overview as the checkout
- [ ] 1.3 Publish dry run green locally and in the `cli-package` job
- [ ] 1.4 Gates green (typecheck, lint, test) and `context-doctor` green
