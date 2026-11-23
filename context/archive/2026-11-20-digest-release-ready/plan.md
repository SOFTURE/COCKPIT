# Plan: digest-release-ready

## Goal
The digest slice is ready to release: production passes the digest settings to the app and the worker, the release
carries them by name, the dry run brings the stack up with them, the version and release notes list CMP-12. Nothing
is tagged, released or deployed (owner's word).

## Approach
**Chosen:** optional names (`${NAME:-}`) for the digest in the compose file, secrets by name in `deploy.yml`, plain
settings as repository variables; version `0.2.0` with its own changelog section.
Rejected: required names (a release without a mail provider would stop, while the app treats the digest as opt-in).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Required or optional | optional, `DIGEST_AT` defaults to `08:00` | the digest is opt-in; the release never stops on it | research, env render |
| Secrets | `RESEND_API_KEY`, `MAILING_UNSUBSCRIBE_SECRET`, `MAILING_UNSUBSCRIBE_SECRET_PREVIOUS`, `DIGEST_RECIPIENTS` | keys and personal addresses stay masked | AGENTS.md (recipients are runtime config) |
| Variables | `MAIL_FROM`, `DIGEST_AT` | public settings, through `app-vars` | deploy workflow |
| Services | worker gets all six; app the same six | one configuration for both processes; the app verifies unsubscribe links | research |
| Version | `0.2.0`, `CHANGELOG.md` section `0.2.0 (unreleased)` listing CMP-12 | one version per slice | roadmap |

## Phase 1: Digest settings in production, version and notes
**Discipline:** TDD (the stack test first). **Files:** `docker/prod/docker-compose.yml`,
`.github/workflows/deploy.yml`, `scripts/deploy-dry-run.sh`, `tests/deploy/production-stack.test.ts`,
`package.json`, `package-lock.json` (version), `CHANGELOG.md`, `README.md` (production environment table),
`context/foundation/roadmap.md` (owner step wording, CMP-12 item status).

**Tests:** `tests/deploy/production-stack.test.ts`: the app and the worker each read the six digest names, all
optional; every optional secret is in `secret-names` with its `env:` line; the required list is unchanged.
The dry run renders fictional digest values and checks the worker's environment carries them.

**Done when:**
- Automated: the stack test passes and fails when a digest name is dropped from a service (mutation checked).
- Automated: Gates green (typecheck, lint, test).
- Automated: `deploy-dry-run` green on the pull request (or locally), with the digest names rendered.
- Automated: `context-doctor` green.

## Risks and rollback
- The real send needs the owner's provider key and sender: listed under `## Before the next release`.
- Rollback: revert the merge; nothing runs outside CI.

## Decisions (auto)
- Optional over required (above). Both services get the same names (simplest, one configuration).
- The stale `in_progress` status on the CMP-12 item block is set to its table value `done_code` in passing.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Digest settings in production, version and notes

#### Automated
- [x] 1.1 Stack test passes; dropping a digest name from a service turns it red — 5d04975
- [x] 1.2 Gates green (typecheck, lint, test) — 5d04975
- [x] 1.3 Deploy dry run green with the digest names rendered (PR #22, run 45147580967: "5 digest settings set" for app and worker) — 8eb64bd
- [x] 1.4 `context-doctor` green (PR #22, run 45147580967) — 8eb64bd
