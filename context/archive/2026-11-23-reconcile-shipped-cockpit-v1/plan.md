# Plan: reconcile-shipped-cockpit-v1

## Approach
Read the releases and the deploy runs on the forge, then edit only `context/` files: the archived roadmap
(rows, `## Done`, `## Summary`, ticks), cockpit-v2's carried steps, `state.json` through the doctor script.

## Evidence (forge, 2026-11-23)
- Releases: v2026.11.23 (3d24069), v2026.11.23-2 (0524971), -3 (b650b18), -4 (72e7f73), -5 (867e65e),
  -6 (f832154); `release` workflow runs green for all six.
- Deploy runs: v2026.11.23 failed verify on "/" (fixed by PR #35); v2026.11.23-2 (run 45180277732) and every later
  tag green; the deploy job logs "verify: https://<app>/api/health answered 200" and "2 routes, 2 passed, 0 failed;
  origin passed" (runs 45180277732, 45253324744).
- `package.json` on master: version 0.7.0, so v2026.11.23-2 carries every slice (0.2.0 to 0.7.0).
- Production settings seen in deploy run 45253324744: `FORGE_TOKEN` and `EDGE_PROOF_SECRET` set; `RESEND_API_KEY`,
  `MAILING_UNSUBSCRIBE_SECRET`, `DIGEST_RECIPIENTS` and `GRAFANA_TOKEN` empty.
- `publish-cli` workflow: 0 runs, so the CLI is not on npm.
- The owner account exists: the owner added nine watched repositories in Settings on 2026-11-23 (scan 16:00).

## Phases
### Phase 1: archived cockpit-v1
- CMP-8, CMP-11, CMP-12, CMP-13, CMP-16, CMP-20, CMP-23: `done_code` → `done (released in v2026.11.23-2)`;
  CMP-18 stays `done_code (waiting: npm publish)`.
- `## Summary`: a Release column; release steps that happened ticked with evidence; the owner-word label step
  ticked obsolete (FR-5 refuses an answer without the label and names it).
- Done when: the doctor passes and the file shows no `waiting: release`.

### Phase 2: cockpit-v2 carried steps
- Tick the release run and create-account (done), drop duplicates, keep: Resend and digest settings (one entry),
  npm token and the word to publish the CLI (one entry), Grafana (optional), `grant-role` admin to invite teammates.
- Done when: `state.json` regenerated, its owner queue lists only those, doctor OK.

## Progress
- [x] Phase 1 — archived cockpit-v1: 7 rows done with v2026.11.23-2, CMP-18 stays done_code, Summary has a Release column, release steps ticked or carried
- [x] Phase 2 — cockpit-v2 carried steps settled: 4 ticked with evidence, duplicates merged, 4 open (digest, grant-role, npm, Grafana); doctor OK
