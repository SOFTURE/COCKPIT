# Plan: digest-mail-when-something-changed

## Goal
A scheduled job compares what the scan stored with a snapshot taken at the last digest and, when something shipped,
started waiting for the owner or broke, sends one list mail per configured recipient with those three sections, each
line linking into COCKPIT; nothing changed means no mail; the footer's one-click unsubscribe works (FR-12).

## Approach
- A new module `digest` (schema `digest`, table `digests`, migration `digest/0001`) keeps one row per digest run that
  changed something: `baseline` (first run), `quiet` (state moved but nothing to report), `pending` (a mail was
  rendered and is being sent) or `sent`, each with the snapshot it was computed from. The latest row is the "last
  digest".
- `src/digest/build-snapshot.ts` (pure): from repositories, reads, forge facts and answers, through the same
  `buildInbox` and `buildOverview` the screens use, one entry per project: done item ids (with outcomes), release
  version, open entry ids (with texts), broken reasons.
- `src/digest/compare-snapshots.ts` (pure): previous vs current → `{ shipped, waiting, broke }`; projects new since
  the previous snapshot contribute nothing.
- `src/digest/render-digest.ts` (pure): subject, text and HTML (escaped) from the sections, copy from
  `messages/en.ts` → `digest`, links on `config.appOrigin` (`/projects/<owner>/<name>`, `/inbox`).
- `src/digest/run-digest.ts`: a pending row is sent first (same content, so a retry never mails different text);
  otherwise compare, then insert `baseline` / `quiet` / `pending`. Sending: `deliverOnce` per recipient, scope
  `digest.mail:<id>`, `kind: "digest"` (list mail: footer and RFC 8058 headers by the module). All recipients
  finished (`sent`, `done`, `rejected`) → row `sent`. `retry-later`, `halted`, `in-flight` → the job retries later;
  `uncertain` → the job fails (operator), the row stays pending.
- `src/digest/digest-settings.ts`: `DIGEST_RECIPIENTS` (comma-separated), `DIGEST_AT` (`HH:MM`, default `08:00`; a
  malformed value stops the app at start, like `SCAN_INTERVAL_MINUTES`), `MAIL_FROM`. No recipients or no sender →
  the job fails as expected `digest.not_configured` and nothing is read or written.
- `softure.config.ts`: `mailing({ from, provider: resend() })`, `digest()`, queue `digest.send` (concurrency 1) with
  schedule `at: [DIGEST_AT]`. `app/unsubscribe/page.tsx` and `app/api/mailing/unsubscribe/route.ts` mount the
  module's page and route; `proxy.ts` excludes both from the guard.

## Phase 1: Digest rule and storage
**Discipline:** TDD (the core rule of the slice: what counts as a change).
- `modules/digest/{index,schema,digests,health}.ts`, `migrations/0001_create_digests.sql`.
- `src/digest/build-snapshot.ts`, `compare-snapshots.ts`, `render-digest.ts`; `messages/en.ts` → `digest`.
- Tests: `tests/digest/compare-snapshots.test.ts`, `build-snapshot.test.ts`, `render-digest.test.ts`,
  `digests.test.ts` (storage, one pending at most).
Done when: the rule's tests (no change → empty; a done item, a new release, a new open entry, a project turned
broken → their sections; a new project → nothing; an answered entry → not waiting) and the storage tests pass.

## Phase 2: Sending on a schedule, unsubscribe
**Discipline:** test-after (wiring over the tested rule) except the acceptance tests of FR-12, written first.
- `@softure-ai/mailing` dependency; config, settings, handler, queue and schedule; page and route; proxy.
- `tests/digest/run-digest.test.ts` over a migrated database with a fake mail provider: first run → baseline, no
  mail; two scans with no change → no mail; a merged item, a new entry and a broken project → one mail per
  recipient listing them under the three sections with links and the unsubscribe headers; provider down → retry
  later, then the same mail once; an unsubscribed recipient gets nothing; not configured → nothing.
- `e2e/unsubscribe.spec.ts`: the page and the one-click route answer without a session.
- `README.md`: the new variables.
Done when: the tests and the e2e pass, gates green.

## Risks and rollback
- A real send needs the owner's provider key, verified sender and secret: verified with the fake provider; the real
  send is an owner step before the release.
- Rollback: remove the module from the config; `DROP SCHEMA digest CASCADE` (the migration says how).

## Decisions (auto)
- Recipients and time are environment settings (`DIGEST_RECIPIENTS`, `DIGEST_AT`), daily at 08:00 local by default:
  AGENTS.md keeps recipients out of the repository; one owner today, teams later.
- The first run records a baseline and sends nothing: "since the last digest" has no meaning before one.
- A project added since the last digest is baseline only, so adding a repository never mails its history.
- The digest is list mail (`kind: "digest"`): the PRD asks for one-click unsubscribe, which the module gives list mail.
- Store the rendered mail on the pending row: a retry after an outage sends the same text the first attempt did
  (the provider refuses a different body under the same idempotency key).
- Migration lives in the new module (`modules/digest/migrations/0001`), not `db/migrations/` as the roadmap guessed:
  COCKPIT's migrations are per module.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Digest rule and storage

#### Automated
- [x] 1.1 Compare tests pass: no change, shipped item, new release, new open entry, turned broken, new project, answered entry — 2e8fe62
- [x] 1.2 Snapshot, render and storage tests pass (one pending digest at most) — 2e8fe62
- [x] 1.3 Gates green (typecheck, lint, test) — 2e8fe62

### Phase 2: Sending on a schedule, unsubscribe

#### Automated
- [ ] 2.1 `tests/digest/run-digest.test.ts` passes: baseline, no change → no mail, change → one mail per recipient with three sections, links and unsubscribe headers, retry sends once, unsubscribed gets nothing, not configured
- [ ] 2.2 `e2e/unsubscribe.spec.ts` passes: page and one-click route public
- [ ] 2.3 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.4 The rendered digest reads well in a mail client width (evidence: Playwright screenshot of the HTML body the run inspects, `cockpit/evidence/digest-mail-when-something-changed/`)
- [ ] 2.5 A real mail reaches the owner's inbox (owner only: needs the provider key, a verified sender and the unsubscribe secret, which only the owner has)
