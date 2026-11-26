---
project: "COCKPIT"
roadmap: later
version: 1
status: waiting
backlog: context/backlog/roadmap-later/
trigger: "the owner picks an item up"
updated: 2026-11-26
---

# Roadmap later: what the owner put off

> Queued (WORKFLOW §5.1). Never promoted as a whole; an item leaves it when the owner raises it.

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |

## Owner decisions and checks

The owner steps below were carried over from cockpit-v4 at its close (2026-11-26) and stay in the owner queue until
they are settled.

- [ ] **CMP-12**: turn the digest on: in Resend verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY` and `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) and `DIGEST_RECIPIENTS` (`SOFTURE_EMAIL_KEY_SECRET` is already set), and the variables `MAIL_FROM` and optionally `DIGEST_AT`; after the following deploy the run checks the first digest and its unsubscribe link (README, "The digest in production"). Today these secrets are empty (deploy run 45375144586). (carried over from cockpit-v2)
- [ ] **CMP-20**: to invite teammates, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`; the invitation mail needs the digest's mail settings above (carried over from cockpit-v2)
- [ ] **CMP-18**: to publish the CLI, store a granular npm token (read and write on the `@softure-ai` scope) as `NPM_TOKEN` in the `npm` environment and give the word to publish `@softure-ai/cockpit` 0.7.0 (`publish-cli` has never run) (carried over from cockpit-v2)
- [ ] **CMP-21** (optional): to show health from observability, set the variable `GRAFANA_URL` and the secret `GRAFANA_TOKEN` (a Grafana service account that may read alert rules) in the `production` environment; today `GRAFANA_TOKEN` is empty (carried over from cockpit-v2)
- [ ] **CT-10**: before the release that carries CT-10, set the secret `ROUTINE_TOKEN_SECRET` (`openssl rand -base64 32`; never change it afterwards, or every stored routine token has to be pasted again) in the `production` environment; then, per project, set up its COCKPIT command routine (`routines/cockpit-command.md` of `@softure-ai/skills` 0.40), paste the fire URL and token on the project's Routines tab and press Test (carried over from cockpit-v4)
