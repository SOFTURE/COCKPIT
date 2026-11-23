# Changelog

Releases are cut by the `release` workflow as date tags (`vYYYY.MM.DD`); each GitHub Release carries its generated
notes. This file lists what each version of the app brings.

## 0.7.0 (unreleased)

The terminal: COCKPIT's views from a shell, installable from npm.

- **Settings:** the Repository field searches the repositories the access token can read and offers the ones not
  watched yet; picking one fills the field, and a typed `owner/name` still works. A repository missing from the list
  has to be added to the token first, as the field's hint says.
- **Settings:** the screen reads as a narrow column of cards (watched repositories, team, account), each with a
  title, one line on what it is for and its actions as the same outline buttons; Log out lines up with its neighbours.
- **Sidebar:** "Log out" is a full-width sidebar row whose text starts at the same left edge as "Signed in as …"
  and the navigation, on a desktop and in the phone's sidebar sheet.
- **App icon:** tabs, bookmarks and the iOS home screen show COCKPIT's own icon (a gauge in the theme's primary
  colours, drawn with `@softure-ai/theme-kit/next`), also on the login page, without a session.
- **Deploy:** the production stack joins the edge network the optional variable `EDGE_NETWORK` names (`softure-edge`
  by default), so it runs next to a shared Traefik whose network has another name.
- **Deploy:** the release verifies only public routes, `/api/health` and the rendered `/unsubscribe` page, since `/`
  always redirects to a sign-in and failed verify on a healthy release.

- **Terminal views:** `cockpit overview | inbox | project <owner/name> [--json]` prints the same values as the
  screens with a read token, and names the cause with no stack trace when the token or COCKPIT is missing (CMP-17).
- **Release:** the command is packed as the standalone npm package `@softure-ai/cockpit` (one bundled file, no
  dependencies, Node 22); CI runs a publish dry run that installs the packed tarball and runs it; the manual
  `publish-cli` workflow publishes it, on the owner's word only (CMP-18).

## 0.6.0 (unreleased)

Teams: the owner invites teammates, who see and answer the same projects, and every answer names who gave it.

- **Teammates:** Settings → Team (admin only) lists the members with Remove and invites by email, with resend and
  revoke; an invited teammate creates their account from the link while registration stays closed; a removed
  teammate's next request lands on the login page (CMP-19).
- **Attribution:** the inbox, the history, the project page and the owner-word issue name who gave each answer
  (CMP-19).
- **Release:** invitations are mailed through the digest's provider (`MAIL_FROM`, `RESEND_API_KEY`); without them an
  invitation stays pending ("not sent") and can be resent. The `grant-role` ops script ships in the image so the
  owner can be made admin after `create-account`; the deploy dry run checks it (CMP-20).

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

## 0.4.0 (unreleased)

The project page: one screen per project, so the owner sees where it stands and what happened without opening the
repository.

- **Project page:** each project opens as a page with its active roadmap items and stages in roadmap order, queued
  roadmaps with their start condition, open changes, the owner's entries answered as in the inbox, and links into the
  repository; a failed read keeps the last good data and names the failure (CMP-9).
- **History and doctor findings:** the page lists recent merges, releases, CI and quality-review runs, and the
  `context-doctor` findings (CMP-10).
- **Release:** the slice adds no setting, migration or service; it deploys with the existing configuration, and the
  deploy dry run stays green (CMP-11).

## 0.3.0 (unreleased)

MCP: an assistant reads COCKPIT and, with write access, answers what waits for the owner.

- **Read over MCP:** an assistant connected with a token from Settings → *Assistant access (MCP)* or through OAuth
  reads the overview, the inbox and a project's detail with the same values as the screens; text from the watched
  repositories comes between untrusted-data markers (CMP-14).
- **Answer over MCP:** a write token or an OAuth grant with write access answers an entry Yes, No or Later with a note
  through `answer_entry`, by the inbox's own rule: one owner-word issue, the entry shows sent, a repeat returns the
  first answer; a read token never sees the tool (CMP-15).
- **Release:** production passes `MCP_ALLOW_WRITES` and `MCP_DIAGNOSTICS` to the app as optional variables; the
  deploy dry run checks they arrive and that the MCP endpoint and its OAuth discovery answer (CMP-16).

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
