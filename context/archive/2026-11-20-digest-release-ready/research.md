# Research: digest-release-ready

Read on master 47fad4c (CMP-1 to CMP-9 and CMP-12 merged), with `@softure-ai/deploy` 0.7.8 and
`@softure-ai/mailing` as installed.

## How things are today
- CMP-12 added the digest: a daily job on the queue `digest` (worker), the mailing module with Resend, and the
  one-click unsubscribe route `app/api/mailing/unsubscribe/route.ts` (app). It reads `MAIL_FROM`, `RESEND_API_KEY`,
  `MAILING_UNSUBSCRIBE_SECRET` (and `MAILING_UNSUBSCRIBE_SECRET_PREVIOUS` while a secret rotates), `DIGEST_RECIPIENTS`
  and `DIGEST_AT` (`src/digest/digest-settings.ts`, `softure.config.ts`).
- None of these names is in `docker/prod/docker-compose.yml`, so `softure-deploy env render` never writes them into
  `.env.prod` and production would run without a digest. The roadmap's owner step for CMP-12 says "CMP-13 passes them
  to the app and the worker".
- `.github/workflows/deploy.yml` passes secrets by name (`env:` plus `secret-names`), and every repository or
  environment variable through `app-vars: toJSON(vars)`.
- `tests/deploy/production-stack.test.ts` checks that the compose file's required names equal `secret-names` plus
  `APP_HOST`, and pins the required secret list.
- `CHANGELOG.md` has `0.1.0 (unreleased)` for the first slice; `package.json` is `0.1.0`. Nothing is tagged yet.
- `scripts/deploy-dry-run.sh` renders `.env.prod` from fictional values and brings the stack up (CI job
  `deploy-dry-run`).

## What the packages give
- `env render`: `${NAME:-default}` is optional: written when set, left out otherwise, so a release never stops on it
  (deploy README, env render).
- `secret-names` reads only the listed names; an empty value counts as unset (deploy README, action inputs).
- Mailing: `RESEND_API_KEY` is read at send time; `MAILING_UNSUBSCRIBE_SECRET` signs and verifies the link, at least
  32 characters; missing at send time means list mail answers `unavailable` with a log line (mailing README, env).
- The digest stays off without recipients or a sender (`getDigestSettings`), and `getDigestAt` refuses a malformed
  time at start.

## Who reads what
- worker: sends the digest, so all six names.
- app: verifies unsubscribe links (`MAILING_UNSUBSCRIBE_SECRET`, `..._PREVIOUS`) and loads the same config
  (`MAIL_FROM`, `DIGEST_AT` validated at start); it sends nothing, but the same values keep both processes on one
  configuration.

## Framing
`frame` skipped: the outcome is the packaging step the roadmap fixes (version, notes, secret names, dry run); no
competing framing.

## Risks
- A required name would stop the first release until the owner has a mail provider; optional names keep the digest
  an opt-in, as the app already treats it.
- Parallel items (CMP-14 MCP, CMP-19 teams, CMP-21 adapters) may also add names to the compose file and
  `deploy.yml`: merge the main branch in before merging.
