# Changelog

Releases are cut by the `release` workflow as date tags (`vYYYY.MM.DD`); each GitHub Release carries its generated
notes. This file lists what each version of the app brings.

## 0.7.0 (unreleased)

The terminal: COCKPIT's views from a shell, installable from npm.

- **Recent fires as a list, two weeks back:** a project's "Recent fires" card on the Routines tab shows one row per
  cockpit issue of the last 14 days: its number, title and fire time on the left, and a green "Fired", red "Failed",
  blue "Waiting" or grey "No routine" badge on the right (each routine's result in its tooltip), with Retry under it
  where something did not go through.
- **A fire reads only its state:** each fire shows "Routine fired", "No routine to fire" or the failure with its HTTP
  status and reason; the routine's name is in the tooltip. On a broadcast's page it sits on the line with "Sent".
- **The Routines tab works in dialogs:** "Add routine" in the card's header opens the form in a dialog; each field's
  hint is a "?" tooltip by its label; the kind is picked from a list that names it in words ("Wake on a new cockpit
  issue") and the server accepts only listed kinds; a new routine starts enabled. Each routine shows a green or orange
  icon by its name and its last call as a green or red badge; on the right sit an on/off switch, Test, "Replace token"
  (a dialog) and Delete (a confirmation dialog).
- **Deleting a sent broadcast asks in a dialog:** the trash can sits inside the row's box, after the arrow, and opens a
  confirmation dialog that says the broadcast's issues stay in the projects; nothing is deleted until its Delete.
- **COCKPIT wakes projects by firing their routines:** each project gets a **Routines** tab where Claude Code
  routines are added (name, kind `cockpit-issues`, trigger id or fire URL, token, enabled), tested, given a new token,
  switched off or deleted. Right after COCKPIT opens a cockpit issue (an inbox or MCP answer, a broadcast, a roadmap
  promotion) it fires every enabled `cockpit-issues` routine of that project with `COCKPIT command: <issue link>`, as
  `routines/cockpit-command.md` of `@softure-ai/skills` expects; every issue it opens is titled `COCKPIT command: …`. Each
  fire shows on the broadcast page, the inbox answer and the Routines tab (sent, failed with the HTTP status and a
  reason, queued, or no routine) with a Retry for that issue; at most 30 fires an hour per routine and 100 in all, a
  429 waits for its `retry-after`. Tokens are stored encrypted with the new optional secret `ROUTINE_TOKEN_SECRET`
  and only their last four characters are ever shown. The overview's **Wakes on its own** now comes from COCKPIT's own
  routines only. Removed: reading a project's wake declaration from its `context/workflow.json`, and the older
  label and marker; COCKPIT creates and reads only `cockpit` issues with the `<!-- cockpit: … -->` marker.
- **One inset for list rows:** clickable rows in a card (roadmap items, queued roadmaps, sent broadcasts) keep their
  hover and open background and the lines between them inside the card's content, never past it, and everything in
  the row, an opened roadmap item's details included, starts the same 8 px in. The run-wide order "Owner at the
  keyboard" no longer repeats `Mode: owner` under its value; another mode note and an item's mode read in the
  panel's language ("Tryb: autonomiczny").
- **Delete a sent broadcast:** every row of the sent broadcasts list has a trash-can button. After a confirm, the
  broadcast and its sends leave COCKPIT's history; the issues it created in the projects stay.
- **Telemetry endpoint from a secret:** `OTEL_EXPORTER_OTLP_ENDPOINT` reaches the app, the worker and the
  migrations whether it is stored as a repository variable or as a secret (a variable wins), so export starts in
  production instead of logging "export disabled (no OTLP endpoint)".
- **COCKPIT in Grafana:** with `OTEL_EXPORTER_OTLP_ENDPOINT` (variable) and `OTEL_EXPORTER_OTLP_HEADERS` (secret)
  set, the app, the worker and the migrations export logs, traces and metrics (namespace `cockpit`, services
  `cockpit` and `cockpit-worker`). Every action leaves one structured log line: forge failures and the issue write,
  each scan and project read, inbox and MCP answers, broadcasts, the digest, MCP tool calls, settings and team
  changes, invitations and the worker's jobs; never a token, an address, a note or a broadcast's text. COCKPIT's own
  alert rules (app silent, worker silent, error series) and dashboard live in `ops/grafana/`, so its project page
  shows its health like any other project's.
- **Wake routine setup link opens:** on a project page, "Set up the wake routine" opens the routine's setup steps
  in the skills repository instead of a GitHub "page not found" (the link pointed at a `main` branch it does not
  have).
- **Issues labelled `cockpit`:** an answer or a broadcast creates its issue with the label `cockpit` (instead of the
  older label), carrying the marker `<!-- cockpit: … -->` of skills 0.39.
- **Roadmap item status above its Promote:** on a queued roadmap an item's status sits at the top of the bar's right
  column and its "Promote to work" (or the issue it became) right under it, inside the item's bar, which lights as one
  box on hover; the separate strip beside the bar is gone. The layout is the shared `StatusActionFoldRow` for every
  folding row with a status and a control.
- **Roadmap items on one grid:** on the roadmap view every item row lines up: the chevron and the item ID (now a
  grey tag, as on the project page) sit on the title's line, the status detail and the outcome start under the title,
  and the status keeps its own column (under the title on a phone). The run-wide orders keep a label whole when it
  carries code with a colon (`Owner at the keyboard (`Mode: owner`)`), show that code as a note under the value, and
  read the known labels and plain values (`no`, `at the end`, `after each item`, `after OM-8`, `up to 2 at once`)
  in the panel's language.
- **Broadcast picker in columns:** on the Broadcast compose screen the watched projects lay out in columns across the
  full width (one column on a phone), and "Pick all" and "Clear all" buttons with a count ("3 of 12 picked") replace
  unticking projects one by one. The count only includes projects still shown in the list.
- **Organisation repositories read and written again (#85):** when several forge tokens are configured and an
  organisation turns another owner's token away (a 403, even on its public repositories), reads and cockpit issues
  move on to the next token, as they did before v2026.11.24-5, and the hint that led to the refused token is dropped.
  A failed broadcast send names the refused token by its label (`FORGE_TOKEN`, `FORGE_EXTRA_TOKENS[1]`, …, never its
  text) and when it was last tried, so a Retry that fails again shows that it ran (migration `projects` 0006).
- **Screens open at once:** links no longer prefetch every visible screen (each sidebar screen and project was
  rendered in the background, twice, on every page view, and kept the server busy behind each click). A broadcast
  sends to four projects at a time, so sending to a dozen projects takes seconds instead of half a minute, and the
  rows of the broadcast lists get the padding of the app's other lists.
- **Success in green:** every state that means "all good" reads green instead of grey: a current package on the
  Packages page, a passed CI or quality review, an OK doctor and a healthy project on the overview, a passed last
  deploy and the version in production on the Deploys page. Running and pending read blue, failures red, warnings
  amber; neutral facts stay grey. An idle project's moon (sidebar and status) is blue.
- **Refresh from every screen (CT-9):** a header bar sits above every page (the menu button on a phone on its left).
  On its right, "Refresh" scans every watched project; while the scan runs the header counts up live ("2 of 5
  refreshed") with a progress bar, and when it ends the page reloads its data and shows when the projects were last
  read. The scan reports its progress through the jobs package (`GET /api/scan-progress`, signed-in users only).
- **CI from the last merged pull request:** a project whose checks run on pull requests only (no CI run on its main
  branch) shows the CI of its last merged pull request instead of "none": every workflow run at that pull request's
  head except the quality review and the deploy, failed if any failed, labelled "from PR #N" with a link, on the
  overview, the project's history, the terminal and the MCP overview (`ci.pullRequest`). A project with CI on its main
  branch is unchanged.
- **Inbox tabs per project:** the inbox groups its entries into an "All" tab and one tab per project, each with an
  icon and a counter of entries waiting. A project tab carries a short code (the initials of the repository name's
  words, `ORDER_TRACKER` → `OT`; the bare name for a one-word name or a code that would repeat) and keeps the shown
  project in the address (`?project=owner/name`). Inside a project tab the rows drop the repeated project name, the
  waiting card links the project, and the "Later" group and the answered history show that project only.
- **Projects of several forge owners are watched:** besides `FORGE_TOKEN`, the optional secret `FORGE_EXTRA_TOKENS`
  takes more fine-grained tokens, one per further resource owner (an organisation next to a personal account),
  comma-separated. Each repository is read, and its cockpit issues are created, with the first token that can read
  it; Settings lists the repositories of every token; a repository no token finds names the owner that needs a token.
  A call goes straight to the token that last read the repository or another repository of its owner, so a scan
  with several tokens asks the forge no more than with one.
- **Roadmap items read cleanly:** a closed item shows its title, status and two lines of its outcome, with an
  "Owner step" badge when it asks something of the owner; opened, the owner's step comes first in a highlighted
  block, then one table of the short facts (prerequisites, size, priority, change, mode) with no field shown twice
  (`Change` and `Depends on` fold into the change and the prerequisites), then the long fields as paragraphs. Inline
  `**Label:**` parts of the outcome and the fields become fields of their own, and HTML comments of the roadmap file
  (language markers) are never shown. The roadmap overview shows its progress on the header row, right-aligned.
- **Deploy block reads at a glance:** on a project's Production tab the version in production and the last deploy
  are two cards; the version is set large, and each step of the last deploy (deploy, verification) is a badge with
  an icon in its state's colour: passed green, skipped amber, failed red, running blue, cancelled grey. A failed
  last deploy tints its card red.
- **An answered entry is never asked again:** an entry its project re-words while settling the owner's answer (the new
  text cites the answer's issue) keeps that answer instead of returning as "changed since your answer", and a
  `(later: #N)` mark inside the text, not only at its end, puts the entry off. The issue an answer becomes now tells
  the project that every answer takes the entry off the owner queue: a Later moves the item to
  `roadmaps/roadmap-later.md` as a new item under that roadmap's own numbering (SOFTURE/SKILLS 0.37.0), and the entry
  is never re-worded in place.
- **Put-off entries leave "Waiting for you":** an entry the owner answered Later, which its project keeps in the
  queue with `(later: #N)`, is shown in its own "Put off" group with its issue, no longer counts as waiting and is no
  longer asked again as a changed entry; it can still be answered. The issue an answer becomes now tells the project
  how to settle the entry (tick it done or declined, or mark it later, regenerate `context/state.json`, close the
  issue), so the entry leaves the owner's list on the next scan.
- **Packages page:** per watched project the last nightly package-update pull request (merged, open, closed, or red
  with its failing check), the packages the routine holds back with their issue, and each `@softure-ai` package's
  locked version against the newest on npm, behind ones marked; a project without an update yet says so. The scan
  reads up to five more forge files and runs per project (no new permission, no new write) and the public npm
  registry once per package.
- **Context drift flagged:** the overview and the project page flag a project whose forge published a release after
  roadmap rows its `context/state.json` still shows as `waiting: release` ("Release v… not settled"), or whose active
  roadmap has every row done and is still live ("Finished roadmap still live"). The flag names what settles it
  (`wt-roadmap.py released <tag>`, or closing the roadmap) and is orange, not a failure: it does not change the
  project's status. Read from what the scan already stores; no new forge read, permission or migration.
- **Project page tabs:** a project's page shows its sections as one tab bar with icons and counters instead of
  stacked boxes: Waiting (the entries waiting for you, with the wake-up below them), Roadmaps (active and queued),
  Changes and, when health or deploy reports, Production. Each tab is a link (`?tab=`), so a reload, the back button
  and an answer sent from the Waiting tab stay on it; the first tab with something in it opens by default.
- **Fix:** on Settings, a repository typed (or an Add pressed) before the token's repository list arrives is no
  longer lost: the Repository field is one field from the first paint, and the list joins it when it comes (#55).
- **Fix:** `cockpit overview` no longer refuses the whole answer as unreadable when a watched project is unhealthy
  (FR-17); the CLI, the digest and the screens read one list of broken reasons.
- **Cockpit issues wake their project:** the overview, the project page and the broadcast page show what wakes
  each project when a cockpit issue lands, as it declares in `context/workflow.json` → `autonomy.ownerWordWake`:
  "Wakes on its own" (the wake routine of `@softure-ai/skills` 0.35.0), "Wakes while a run works" or
  "Waits for its next run", with a link to the routine's setup steps. The scan reads one more file per project
  (Contents read, no new permission, no new write).
- **Dependencies (2026-11-24):** `@softure-ai/mailing` 0.3.0 keys each digest recipient with the new secret
  `SOFTURE_EMAIL_KEY_SECRET` (at least 32 characters); without it the digest stays off. `deploy.json` lists the
  public paths (`publicPaths`) the edge lets through without a login, the same as the app's guard. Deploy pins move
  to `@softure-ai/deploy` 0.7.9, and every screen renders the theme's `PageLayout` (theme-notion 0.31.0).
- **Polish:** with `APP_LOCALE=pl` every screen, the sign-in, token and unsubscribe pages, the digest and invitation
  mails and the MCP tools speak Polish, with Polish dates; `<html lang>` follows. The terminal speaks Polish with
  `COCKPIT_LOCALE=pl` or a Polish terminal. English stays the default; text from the repositories is never translated.
- **One layout, fast Settings:** Settings no longer waits for the forge. The repositories the access token can read
  are read once and kept for five minutes (then refreshed in the background), the picker fills in after the page
  shows, and the page says when the list was read with a "Refresh list" button. Every screen, Settings included,
  uses the full width with the same header, spacing and cards; Team and History show breadcrumbs.
- **Broadcast:** one word to many projects. Write a title and a message, pick the watched projects (all of them at
  first) and send: each picked project gets exactly one issue labelled `cockpit` that carries the broadcast's
  marker, and its page lists every project as sent (with the issue), done (the project closed it) or failed (with
  the reason and a Retry). Sending the same form again or retrying never creates a second issue in a project.
- **Roadmap statuses:** an item's status is a short coloured word with its icon; its waiting condition or stage is
  a quiet line under the title. Pages use the full width of the screen, and a long roadmap title becomes a short
  page title with the rest as its subtitle.
- **Roadmaps:** a roadmap opens inside COCKPIT instead of on the forge: its file is read when the page opens and
  shown as its items in roadmap order (ID, title, status and outcome; opened: prerequisites, size, change, unknowns,
  risk and the rest of its fields), the progress, the start condition, the run-wide orders and the owner's steps and
  decisions. A file that cannot be read shows the items of `context/state.json` and says why.
- **Project page:** the page reads as a column of cards: what waits for you first, then the active roadmap with a
  progress bar and its open items, the queued roadmaps (each opening its roadmap view), the open changes and
  production (health and deploy); the repository and history are buttons in the header.
- **Inbox:** each entry is one compact row: its text, one quiet line with the project, kind, item, age and source
  file, and Yes / No / Later as the theme's small buttons on the right (44 px on a phone).
- **Status:** a repository added in Settings is scanned at once, and until its first read it is no longer shown
  as broken in the sidebar, the overview, the digest or the MCP answers; a read that happened and failed still is.
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
- **Attribution:** the inbox, the history, the project page and the cockpit issue name who gave each answer
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
  through `answer_entry`, by the inbox's own rule: one cockpit issue, the entry shows sent, a repeat returns the
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
- **Answers:** Yes, No or Later with a note becomes one cockpit issue in the project; the entry shows sent, then
  done (CMP-5).
- **Overview:** one row per project, grouped by status, with roadmap progress, queued roadmaps, open changes, waiting
  entries, release, CI and quality review (CMP-6), and the `context-doctor` result (CMP-7).
- **Deploy:** the production image and stack on the host's shared edge, the deploy and release workflows, the build
  info route and a deploy dry run in CI (CMP-8).
