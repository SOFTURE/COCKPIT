---
project: "COCKPIT"
roadmap: cockpit-v4
version: 2
status: ready
prd_version: 3
updated: 2026-11-25
---

# Roadmap cockpit-v4: a list row says each fact once and keeps its controls tidy

> Run-wide orders, read by orchestrators (not parsed):
> - Push main branch: no
> - Archive roadmap: at the end
> - Release: not ordered (no release, tag, publish or deploy without the owner's word)
> - Parallelism: up to 4 at once
> - Owner at the keyboard: none
> - Source: the owner's feedback of 2026-11-25 (F-1 below, with a screenshot of a routine row), not a PRD revision
> - Start: the owner's standing rule that every UI fix is a shared component applied app-wide, rolled out as separate
>   items (2026-11-25 12:26Z)

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **CT-22** | `routine-row-tidy` | a routine row says its on/off state once (the switch) and its last call once (one badge), and keeps Test, Replace token and Delete in one row menu beside the switch, built as the shared `RowActionsMenu` | — | autonomous | **in_progress** (research, since 2026-11-25; cloud session, branch `claude/project-thread-ps3ta3` — do not take in another session) |
| **CT-23** | `row-actions-menu-everywhere` | every list row with more than one control shows at most one inline control plus CT-22's row menu; a row with one action keeps it inline | CT-22 | autonomous | ready |
| **CT-24** | `row-facts-said-once` | no list row in COCKPIT shows a fact twice or puts plain information in its controls slot, pinned by a test | CT-22 | autonomous | ready |

## Order

**Feedback points (no PRD FR), owner, 2026-11-25:**
- F-1 (owner, 2026-11-25 21:09Z, translated, with a screenshot of a routine row on a project's Routines tab): "lay it
  out sensibly, because it is a terrible mess". The screenshot shows, right-aligned with an empty left area: a lone
  green check icon, then a separate green "HTTP 200" badge with its own check icon (the state twice), and on a second
  line the switch labelled "Enabled" (the on/off state a third time), Test, "Replace token" and a trash icon, scattered.
- F-2 (owner's standing rule, 2026-11-25 12:26Z): every UI fix is a standard, a shared component applied app-wide;
  the app-wide rollout goes as separate roadmap items.

**Framing.** Optimising for: quality of the everyday screens (the owner reads them daily). First proof: CT-22, the
row the owner pointed at, which also builds the shared row menu. Main risk: the rollout touching many screens at
once; it is split by concern (controls in CT-23, facts in CT-24) so two threads run side by side on disjoint files.
Depth: the shared component and its rule in CT-22; the rollouts are mechanical.

**Why this order.** CT-22 lands the shared `RowActionsMenu` and the two rules in `src/shell/list-row.tsx`'s doc
comment, so CT-23 and CT-24 apply a finished standard instead of inventing one. CT-23 and CT-24 then run in parallel.

**Sizes:** S is one screen or a mechanical move of existing controls; M builds a shared component and applies it to
its first screen with tests.

### Starting point
- UI: Next.js app with `@softure-ai/theme-notion` 0.31.0 (`package-lock.json`); local list row
  `src/shell/list-row.tsx` (CT-18) and `src/shell/result-badge.tsx`; theme 0.34.0 on npm now ships `ListEntry` and
  `ResultBadge` (from SOFTURE/AI#1481) and has `DropdownMenu` since 0.31.0.
- Routines tab: `src/routines/routines-section.tsx` (state icon + `LastCallBadge` + four controls),
  `src/routines/routine-forms.tsx` (`RoutineEnabledSwitch`, `TestRoutineForm`, `ReplaceTokenDialog`).
- Confirm dialog: `src/shell/confirm-delete-button.tsx` (CT-14/CT-16).
- Tests: Vitest (`tests/**`), Playwright e2e (`e2e/**`), CI jobs `gates`, `e2e`, `deploy-dry-run`, `cli-package`,
  `context-doctor`.
- Data, auth, deploy: unchanged by this roadmap; no migration.

### Lanes
| Lane | Chain | Owns | Note |
| --- | --- | --- | --- |
| A | CT-22 | `src/shell/row-actions-menu.tsx` (new), `src/shell/list-row.tsx`, `src/shell/confirm-delete-button.tsx`, `src/routines/**` except `wake-chip.tsx` | builds the standard |
| B | CT-23 | `app/(app)/broadcast/[id]/page.tsx`, `src/broadcast/**`, `src/routines/wake-chip.tsx` | after CT-22 |
| C | CT-24 | `src/inbox/**`, `app/(app)/inbox/page.tsx`, `src/adapters/packages/**`, `src/overview/**`, `src/project-page/**`, `src/adapters/deploy/**`, `src/team/**`, `src/projects/**`, `app/(app)/scan-status/**` | after CT-22, parallel with CT-23 |

### Slices
| Slice | Items | Size |
| --- | --- | --- |
| **1. The routine row the owner pointed at** | CT-22 | 1 M |
| 2. The standard across the app | CT-23, CT-24 | 1 S, 1 M |

Deferred: moving COCKPIT's local `ListRow` and `ResultBadge` onto theme-notion 0.34's `ListEntry` and `ResultBadge`
(`context/backlog/rows-on-theme-list-entry.md`); not an item until the theme also has the row menu
(SOFTURE/AI#1486) or the owner asks.

## Items

### CT-22: A tidy routine row and the shared row menu
- **Change ID:** `routine-row-tidy`
- **Status:** in_progress (research, since 2026-11-25; cloud session, branch `claude/project-thread-ps3ta3` — do not take in another session)
- **Outcome:** a routine row on a project's Routines tab shows, in its right column, one last-call badge on top (result
  and time, for example "HTTP 200 · 21:04", red on an error) and under it the on/off switch with its label and one
  "More actions" button that opens a menu with Test, Replace token and Delete (Delete last, in the danger tone, still
  asking in the shared confirmation dialog); the separate state icon and the duplicate "last call" detail line are
  gone. The menu is the shared `RowActionsMenu`, and `ListRow`'s doc comment states the two rules: at most one inline
  control, the rest in the menu; each fact said once.
- **Prerequisites:** —
- **Touches (estimate):** `src/shell/row-actions-menu.tsx` (new, on theme-notion's `DropdownMenu`),
  `src/shell/list-row.tsx` (doc comment), `src/shell/confirm-delete-button.tsx` (opened from a menu item),
  `src/routines/routines-section.tsx`, `src/routines/routine-forms.tsx` (Test and Replace token started from a menu
  item), `messages/en.ts` and `messages/pl.ts` (own keys), `tests/shell/**`, the Routines e2e spec.
- **Size:** M
- **Unknowns:**
  - How Test reports its result once it runs from a menu item: the last-call badge refreshes and the result is
    announced (today's `Result` is hidden and announced); recommended: keep that, no toast. (owner: research; blocks: no)
  - Whether a dialog opened from a `DropdownMenu` item keeps focus right (Radix needs the menu closed first or a
    controlled dialog). (owner: research; blocks: no)
- **Risk:** the Routines e2e specs click Test, Replace token and Delete directly; they must open the menu first, and
  their `data-*` selectors stay.
- **Baseline:** today the row shows the enabled state three times and four loose controls on a wrapped line (F-1
  screenshot); after: a unit test pins `RowActionsMenu` (items, keyboard, destructive last) and the e2e at 1280 and
  390 px finds one badge, the switch and the menu button on one line in the right column, and the three actions in
  the menu.
- **Layout:** the row has two columns, top-aligned. Left: the name with its kind tag, one muted line under it
  (provider · target · token …1234). Right, right-aligned, two lines and never more at 1280 px: line 1 the last-call
  badge alone ("HTTP 200 · 21:04", or "Never called" in grey); line 2 the switch with its label, then the "More
  actions" icon button (the menu: Test, Replace token, a separator, Delete in red). Nothing else in the row: no state
  icon, no second check, no loose buttons. At 390 px the right column wraps under the left as one block, the same two
  lines, controls 44 px. Every routine row has the same height and the same column edges.
- **Verification:** unit tests for `RowActionsMenu` (renders its items, opens with Enter and arrow keys, Delete last
  and opens the confirmation dialog, Escape closes) and for the routine row (one badge, no state icon, switch and menu
  on one line); e2e on the Routines tab: add a routine, switch it off and on, Test from the menu and see the badge
  change, Replace token from the menu, Delete from the menu with confirm and cancel, all at 1280 and 390 px, with the
  bounding boxes asserting the badge and the controls line sit in the right column on two lines. Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-1, F-2
- **Input:** context/changes/routine-row-tidy/change.md

### CT-23: Every row with several controls uses the row menu
- **Change ID:** `row-actions-menu-everywhere`
- **Status:** ready
- **Outcome:** every list row in COCKPIT with more than one control shows at most one inline control (the one the row
  is mostly used for) and the rest in CT-22's `RowActionsMenu`; today that is the Broadcast detail's project rows
  (Issue link, Retry fire, Retry send); a row with a single action keeps it inline.
- **Prerequisites:** CT-22
- **Touches (estimate):** `app/(app)/broadcast/[id]/page.tsx`, `src/broadcast/**`, `src/routines/wake-chip.tsx`
  (`RetryWakeForm` started from a menu item, read-only use of CT-22's pattern), the Broadcast e2e spec.
- **Size:** S
- **Unknowns:**
  - Which control stays inline on a Broadcast project row: recommended Retry send when the send failed, otherwise
    the Issue link. (owner: research; blocks: no)
- **Risk:** `wake-chip.tsx` is also used by the inbox (CT-24's lane): only CT-23 edits it; CT-24 reads it.
- **Baseline:** today a Broadcast project row can show three loose buttons; after: a grep of `actions={[` with more
  than one control outside `RowActionsMenu` finds none, and the Broadcast e2e passes at 1280 and 390 px.
- **Layout:** the same right column as CT-22: state on line 1, then one inline control and the "More actions" button
  on line 2; a row with one action keeps only that action on line 2, no menu.
- **Verification:** a unit test that a row with two or more controls renders one inline control plus the menu; e2e on
  the Broadcast detail opening the menu and running each action (Issue, Retry fire, Retry send) at 1280 and 390 px.
  Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-2
- **Input:** context/changes/row-actions-menu-everywhere/change.md

### CT-24: Every row says each fact once
- **Change ID:** `row-facts-said-once`
- **Status:** ready
- **Outcome:** no list row in COCKPIT shows the same fact twice (a state icon beside a badge saying the same, a badge
  repeating a detail line) or puts plain information in its controls slot; the inbox's answered rows and history move
  "answered by" into the row's details, and the held packages move "no issue" into the details; every other list
  (overview, project page, history tab, deploys, packages, Team, Settings, Scan status) is audited and fixed where it
  repeats itself.
- **Prerequisites:** CT-22
- **Touches (estimate):** `src/inbox/inbox-row.tsx`, `app/(app)/inbox/page.tsx`, `src/adapters/packages/packages-details.tsx`,
  and, where the audit finds a repeat, `src/overview/**`, `src/project-page/**`, `src/adapters/deploy/**`,
  `src/team/**`, `src/projects/**`, `app/(app)/scan-status/**`; related e2e specs.
- **Size:** M
- **Unknowns:**
  - The audit's full list of repeats beyond the two known ones (owner: research; blocks: no)
- **Risk:** the inbox is the densest screen; moving text out of the right column must not hide the answer form
  (`data-row-wide`).
- **Baseline:** today the inbox and held packages put text in the controls slot and the routine row repeats its
  state (fixed by CT-22); after: the change lists every list audited with its verdict, and an e2e per touched screen
  checks the right column holds only badges and controls, at 1280 and 390 px.
- **Layout:** the right column holds only state (badges) on line 1 and controls on line 2; who answered, issue
  references as text and times move to the muted line under the title on the left.
- **Verification:** for every list audited, the change records the verdict (clean, or what moved); an e2e per touched
  screen asserts the right column contains only badges and controls (no plain text spans), at 1280 and 390 px; a unit
  test per moved fact asserts it appears once in the row. Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-2
- **Input:** context/changes/row-facts-said-once/change.md

## Owner decisions and checks

The owner steps below were carried over from it and stay in the owner queue until they are settled.

## Owner decisions and checks

- [ ] **CMP-12**: turn the digest on: in Resend verify the sending domain and create an API key; in the `production` environment set the secrets `RESEND_API_KEY` and `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) and `DIGEST_RECIPIENTS` (`SOFTURE_EMAIL_KEY_SECRET` is already set), and the variables `MAIL_FROM` and optionally `DIGEST_AT`; after the following deploy the run checks the first digest and its unsubscribe link (README, "The digest in production"). Today these secrets are empty (deploy run 45375144586). (carried over from cockpit-v2)
- [ ] **CMP-20**: to invite teammates, run `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`; the invitation mail needs the digest's mail settings above (carried over from cockpit-v2)
- [ ] **CMP-18**: to publish the CLI, store a granular npm token (read and write on the `@softure-ai` scope) as `NPM_TOKEN` in the `npm` environment and give the word to publish `@softure-ai/cockpit` 0.7.0 (`publish-cli` has never run) (carried over from cockpit-v2)
- [ ] **CMP-21** (optional): to show health from observability, set the variable `GRAFANA_URL` and the secret `GRAFANA_TOKEN` (a Grafana service account that may read alert rules) in the `production` environment; today `GRAFANA_TOKEN` is empty (carried over from cockpit-v2)
- [ ] **CT-10**: before the release that carries CT-10, set the secret `ROUTINE_TOKEN_SECRET` (`openssl rand -base64 32`; never change it afterwards, or every stored routine token has to be pasted again) in the `production` environment; then, per project, set up its COCKPIT command routine (`routines/cockpit-command.md` of `@softure-ai/skills` 0.40), paste the fire URL and token on the project's Routines tab and press Test

## Done

## Decisions (auto)
- PRD readiness → proceed from feedback (`--from-feedback`), no PRD change (a visual standard, no new requirement)
- Baseline → the probes as read in this run, unconfirmed (autonomous mode)
- Framing → optimise for quality; first proof CT-22; main risk the breadth of the rollout (the owner's rule F-2)
- Split of the rollout → by concern (controls vs. facts), so the two items own disjoint files and run in parallel
- Theme 0.34 `ListEntry`/`ResultBadge` → deferred to the backlog: it lacks the row menu (SOFTURE/AI#1486, filed in
  this run) and a theme bump is the package-update routine's job
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos" → every item
  carries a Layout spec and a Verification line (unit, e2e, screenshots at 1280/390 light/dark)
- Prefix → `CT` continues (cockpit-v3 is archived; numbers stay stable)
