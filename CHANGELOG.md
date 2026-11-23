# Changelog

Releases are cut by the `release` workflow as date tags (`vYYYY.MM.DD`); each GitHub Release carries its generated
notes. This file lists what each version of the app brings.

## 0.5.0 (unreleased)

Adapters: each project also shows its health from observability and what runs in production.

- **Health from observability:** with `GRAFANA_URL` and `GRAFANA_TOKEN` set, the scan reads each project's own alert
  rules (`ops/grafana/rules.json`) in Grafana: Healthy, Unhealthy with the firing rules (the project is broken), or
  Health unknown with the reason, in the overview and on the project page; unset, no project shows health (CMP-21).
- **Deploy state:** a project with a deploy workflow shows on its page the version in production and its last deploy
  (passed, failed at a server step, cancelled or running) with its verification and run, read from the forge with the
  same token (CMP-22).
- **Release:** production passes `GRAFANA_URL` (a variable) and `GRAFANA_TOKEN` (a secret) to the worker, both
  optional: without them health stays off and the release still deploys; the deploy dry run checks they reach the
  worker and not the app (CMP-23).

## 0.2.0 (unreleased)

The digest: a daily mail with what changed, so the owner need not open COCKPIT to learn that something waits.

- **Digest mail:** once a day at `DIGEST_AT` the worker mails `DIGEST_RECIPIENTS` what shipped, what started waiting
  for them and what broke since the last digest, each with a link; nothing is sent when nothing changed, and every
  mail carries a one-click unsubscribe (CMP-12).
- **Release:** production passes the digest's settings to the app and the worker, all optional: without a sender or
  recipients the digest stays off and the release still deploys; the deploy dry run checks they arrive (CMP-13).

## 0.1.0 (unreleased)

The first usable slice: one place to see every watched project and answer what waits for the owner.

- **Sign-in and shell:** the owner signs in with the account the operator created; nobody can sign up (CMP-1).
- **Watched repositories:** the owner adds and removes repositories on the Settings screen, checked against the forge
  token (CMP-2).
- **Scan:** every project's `context/state.json` and forge facts are read on a schedule and on demand (CMP-3).
- **Inbox:** every owner-queue entry of every project in one list, oldest first (CMP-4).
- **Answers:** Yes, No or Later with a note becomes one owner-word issue in the project; the entry shows sent, then
  done (CMP-5).
- **Overview:** one row per project, grouped by status, with roadmap progress, queued roadmaps, open changes, waiting
  entries, release, CI and quality review (CMP-6), and the `context-doctor` result (CMP-7).
- **Deploy:** the production image and stack on the host's shared edge, the deploy and release workflows, the build
  info route and a deploy dry run in CI (CMP-8).
