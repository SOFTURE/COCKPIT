# Plan: project-page-release-ready

## Goal
The project-page slice is ready to release: its version and release notes list CMP-9 and CMP-10, and the deploy dry
run is green. Nothing is tagged, released or deployed (owner's word).

## Approach
**Chosen:** bump the version and add a changelog section; no compose or workflow change, since the slice adds no
environment name, migration or service (research).
Rejected: no version bump (each slice gets its own version, as CMP-8 and CMP-13 did).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Version | `0.4.0`, section `0.4.0 (unreleased)` | `0.3.0` is taken by the open MCP release (PR #27) | research |
| Production settings | none added | the slice reads only `FORGE_API_URL`, already passed | research |

## Phase 1: Version and release notes
**Discipline:** test-after (no behaviour changes; the evidence is the gates and the dry run). **Files:**
`package.json`, `package-lock.json` (version), `CHANGELOG.md`, `context/foundation/roadmap.md` (owner step).

**Done when:**
- Automated: Gates green (typecheck, lint, test).
- Automated: `deploy-dry-run` green on the pull request.
- Automated: `context-doctor` green.

## Risks and rollback
- Version collision: re-checked against master before the merge.
- Rollback: revert the merge; nothing runs outside CI.

## Decisions (auto)
- `0.4.0` over `0.3.0` (above).

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Version and release notes

#### Automated
- [ ] 1.1 Gates green (typecheck, lint, test)
- [ ] 1.2 Deploy dry run green on the pull request
- [ ] 1.3 `context-doctor` green
