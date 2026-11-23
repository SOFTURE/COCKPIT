# Plan: edge-network-configurable

## Approach
Replace the two literal `softure-edge` names in `docker/prod/docker-compose.yml` with `${EDGE_NETWORK:-softure-edge}`.
`softure-deploy env render` already writes optional names from `app-vars` (`toJSON(vars)`) into `.env.prod`, and
`deploy.sh` runs compose with that file, so a `production` variable `EDGE_NETWORK` reaches the server without any
workflow change beyond its comment. The stack test interpolates the variable (default and a custom name) before
`checkSharedHostCompose`, which reads the YAML literally. The dry run renders a custom `EDGE_NETWORK` and checks that
compose resolves it, so the variable path is proven end to end. README's Deploy section lists the variable.

## Key decisions
- Compose interpolation instead of a regenerated file: `init --edge` bakes the name, with no runtime setting in
  `@softure-ai/deploy`; the gap is filed in SOFTURE/AI.
- A variable, not a secret: the network name is not sensitive and must not mask log text.
- Default `softure-edge` keeps every existing setup working unchanged.

## Phase 1: Configurable edge network

- Files: `docker/prod/docker-compose.yml`, `tests/deploy/production-stack.test.ts`, `scripts/deploy-dry-run.sh`,
  `.github/workflows/deploy.yml` (comment), `README.md`, `CHANGELOG.md`.
- Mode: TDD.
- Done when: a test that both places read `${EDGE_NETWORK:-softure-edge}` fails on master and passes after;
  `checkSharedHostCompose` passes for the default and for a custom name; `docker compose config` resolves a custom
  name; gates green; the pull request's CI (`deploy-dry-run` included) is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Configurable edge network

#### Automated
- [x] 1.1 Stack test red on master: 2 failed (the custom-name `checkSharedHostCompose` case and the variable check) — 409d17d
- [x] 1.2 Compose reads `EDGE_NETWORK` in both places; stack test green for the default and a custom name (12/12) — 409d17d
- [x] 1.3 `softure-deploy env render` writes `EDGE_NETWORK=example-edge`; `docker compose config` resolves network and label to `example-edge`, and to `softure-edge` unset — 409d17d
- [x] 1.4 Dry run renders `EDGE_NETWORK=cockpit-dry-run-edge` and checks the resolved config; README, deploy.yml comment and CHANGELOG name the variable — 409d17d
- [x] 1.5 Gates green: typecheck, lint (language scan), test, doctor — 409d17d
