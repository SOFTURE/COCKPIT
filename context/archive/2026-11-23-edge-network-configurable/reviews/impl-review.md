# Implementation review: edge-network-configurable

Scope: full · Date: 2026-11-23 · Commits: 409d17d · Gates: typecheck ✓ lint ✓ test ✓ doctor ✓

## Verdict
Ready. Both literal `softure-edge` names in the production compose file now read `${EDGE_NETWORK:-softure-edge}`;
the stack test holds `checkSharedHostCompose` to the edge rules for the default and a custom name, and fails if a
literal name comes back. `softure-deploy env render` writes the optional variable from `app-vars`, and compose
resolves it in the network and the `traefik.docker.network` label. The dry run now uses a non-default name, so CI
proves the variable path on every pull request. Entry point `websecure` and resolver `letsencrypt` are unchanged and
match the documented Traefik.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | |
| Progress honesty | PASS | red run recorded before the fix |
| Correctness | PASS | |
| Tests | PASS | |
| Security | PASS | a variable, not a secret; edge proof rules still checked |

## Findings
None.

## Decisions (auto)
- The platform gap (init bakes the network name, no runtime setting) is filed in SOFTURE/AI, not worked around
  further here.
