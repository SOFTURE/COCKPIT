---
change_id: edge-network-configurable
title: "The production stack joins the edge network the operator names, softure-edge by default"
status: archived
roadmap_item: null
branch: claude/project-thread-xbc6gn
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The production compose file joins the external edge network named by the optional variable `EDGE_NETWORK`
(default `softure-edge`), both as the network it joins and in the `traefik.docker.network` label, so COCKPIT
deploys next to a shared Traefik whose network has another name without editing the repository.

## Context
The target server's shared Traefik runs in another stack's network, not in `softure-edge`; the compose file
(written by `softure-deploy init --edge=softure-edge`) hardcodes the name in two places, which blocks the first
deploy. The entry point `websecure` and the certificate resolver `letsencrypt` already match that Traefik.

## Constraints
- The server's network name stays runtime configuration (a `production` environment variable), never committed.
- No release, tag, publish or deploy.
- `deploy-dry-run` stays green.

## Notes
- Research skipped: three files name the network (compose, dry-run script, stack test), found by grep; the
  `@softure-ai/deploy` 0.7.8 README documents `--edge=<network>` as an init-time constant with no runtime setting, and
  `softure-deploy env render` renders optional `${NAME:-default}` names from `app-vars`, which is the supported path.
- Frame skipped: the outcome is a deploy blocker named by the coordinator after a server check.
