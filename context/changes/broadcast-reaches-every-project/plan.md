# Plan: broadcast-reaches-every-project

## Approach
A new `src/broadcast/` feature over two new tables in the `projects` module. The owner writes a title and a body on
`/broadcast`, picks projects (all watched ones checked by default) and sends. The form carries an id made when the
page renders, so a resubmission is the same broadcast. Each chosen project gets a send row claimed before any forge
call (unique per broadcast and project); the send checks the `owner-word` label, creates one issue whose body ends
with `<!-- cockpit-broadcast: {"id": "<id>"} -->`, and records "sent" with the issue, or "failed" with a reason
code. `/broadcast/<id>` lists every project as sent (issue link), done (the issue is closed in the scan's stored
issues) or failed (reason, Retry). A retry, a resend or a stale claim first looks for an issue that already carries
the marker and adopts it, so no project ever gets a second issue.

## Key decisions
- Same write as answers (NFR-7): no new client method, no new scope (NFR-5).
- Failed sends stay as rows with a reason (not released like answers): the page has to show them and offer a retry.
- "Done" comes from the scan's stored owner-word issues, like the inbox: the page makes no forge call.
- Sends run one after another in the request: at most a few dozen projects, and a rate limit stops the rest as
  failed with that reason (retry later), instead of a job queue.
- Any signed-in member may broadcast, as any member may answer (FR-16); the sender's public name goes in the issue.
- Body length limit 10 000 characters, title 200.

## Phase 1: Data and send logic (TDD)
- Files: `modules/projects/migrations/0005_create_broadcasts.sql`, `modules/projects/schema.ts`,
  `modules/projects/index.ts`, `modules/projects/broadcasts.ts`, `src/forge/issues.ts` (`formatBroadcastIssue`),
  `src/broadcast/broadcast-marker.ts`, `src/broadcast/send-broadcast.ts`, `src/broadcast/build-broadcast-view.ts`,
  `tests/broadcast/**`, `tests/forge/issues.test.ts`, `tests/support/memory-forge.ts` (several repositories).
- Done when: tests send one broadcast to three fictional projects and find three issues with the label and the
  marker; send it again and still find three; fail one project (forge refuses) and retry it into one issue; a lost
  answer is adopted, not duplicated; a stale claim is taken over; a project without the label fails with
  `label_missing`; a closed issue reads "done"; every forge write in these tests is `POST .../issues`.

## Phase 2: Pages, navigation and copy
- Files: `app/(app)/broadcast/page.tsx`, `app/(app)/broadcast/[id]/page.tsx`, `app/(app)/broadcast/actions.ts`,
  `src/broadcast/broadcast-form.tsx`, `src/broadcast/load-broadcasts.ts`, `src/shell/navigation.ts`,
  `src/shell/app-sidebar.tsx`, `messages/en.ts`, `e2e/broadcast.spec.ts`, `e2e/fake-forge.ts` (herald-* fixtures),
  `CHANGELOG.md`.
- Done when: an e2e sends a broadcast to two fictional projects with the label and one without, sees two "Sent" with
  links and one "Failed" with the reason and a Retry, and the fake forge holds exactly one issue per labelled project
  after a resubmit and a retry; at 390 px every control is at least 44 px and nothing scrolls sideways; screenshots
  light/dark at 1280 and 390 are inspected and stored as evidence; gates and e2e green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Data and send logic

#### Automated
- [ ] 1.1 Migration 0005 and the broadcasts store
- [ ] 1.2 Broadcast issue format and marker, with tests
- [ ] 1.3 `sendBroadcast` and `retryBroadcastSend` with the idempotency tests (three projects, resend, fail and retry, lost answer, stale claim, label missing, writes only issue creation)
- [ ] 1.4 Broadcast view: sent, done, failed

### Phase 2: Pages, navigation and copy

#### Automated
- [ ] 2.1 `/broadcast` compose and list, `/broadcast/<id>` status with retry, sidebar entry, English copy
- [ ] 2.2 e2e: send, resend, failure and retry, 390 px phone check
- [ ] 2.3 Screenshots light/dark at 1280 and 390 inspected and stored
- [ ] 2.4 Gates green: typecheck, lint, test, doctor, build and e2e
