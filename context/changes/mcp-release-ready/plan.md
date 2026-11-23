# Plan: mcp-release-ready

## Goal
The MCP slice is ready to release: production passes the MCP settings to the app, the dry run proves the MCP endpoint
and its OAuth discovery answer in the production stack, the version and release notes list CMP-14 and CMP-15.
Nothing is tagged, released or deployed (owner's word).

## Approach
**Chosen:** optional names `MCP_ALLOW_WRITES` and `MCP_DIAGNOSTICS` for the app in the compose file, passed as
repository or environment variables (`app-vars`, no secret); version `0.3.0` with its own changelog section.
Rejected: required names (both have safe defaults; a release never needs them).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Required or optional | optional, empty by default | writes on and diagnostics off are the code defaults | research |
| Kind | variables, not secrets | switches; a secret `1` would mask every `1` in the logs | deploy.yml comment |
| Services | app only | only the app serves MCP; the worker reads neither | research |
| Dry run | the settings reach the app; `/.well-known/oauth-protected-resource` answers 200 naming `<origin>/api/mcp`; `POST /api/mcp` without a token answers 401 | proves the slice is live in the production image, through the security module | research |
| Version | `0.3.0`, `CHANGELOG.md` section `0.3.0 (unreleased)` listing CMP-14, CMP-15, CMP-16 | one version per slice | roadmap |

## Phase 1: MCP settings in production, version and notes
**Discipline:** TDD (the stack test first). **Files:** `docker/prod/docker-compose.yml`,
`.github/workflows/deploy.yml` (comment), `scripts/deploy-dry-run.sh`, `tests/deploy/production-stack.test.ts`,
`package.json`, `package-lock.json` (version), `CHANGELOG.md`, `README.md` (production environment table, MCP
section), `context/foundation/roadmap.md` (owner step, CMP-15 table status).

**Tests:** `tests/deploy/production-stack.test.ts`: the app reads both MCP names, each optional and empty by default;
the required list and `secret-names` are unchanged. The dry run renders fictional MCP values, checks the app's
environment carries them, and probes the discovery document and the unauthenticated MCP call.

**Done when:**
- Automated: the stack test passes and fails when an MCP name is dropped from the app (mutation checked).
- Automated: Gates green (typecheck, lint, test).
- Automated: `deploy-dry-run` green on the pull request (or locally), with the MCP checks.
- Automated: `context-doctor` green.

## Risks and rollback
- Rollback: revert the merge; nothing runs outside CI.

## Decisions (auto)
- Optional variables over required secrets (above). App only (simplest; the worker serves no MCP).
- The stale `ready` status of CMP-15 in the roadmap table is set to `done` in passing (its `## Done` line exists).

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: MCP settings in production, version and notes

#### Automated
- [ ] 1.1 Stack test passes; dropping an MCP name from the app turns it red
- [ ] 1.2 Gates green (typecheck, lint, test)
- [ ] 1.3 Deploy dry run green with the MCP checks
- [ ] 1.4 `context-doctor` green
