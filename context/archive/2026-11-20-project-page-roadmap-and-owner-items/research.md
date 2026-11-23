# Research: project-page-roadmap-and-owner-items

## Question
How CMP-9 turns the project route into a page that shows a watched project's active roadmap items with their
stages, its queued roadmaps with their start condition, its open changes, the owner's entries for this project
(answerable as in the inbox) and links to the repository (FR-10, G-3).

## Today (master 18683e6)
- `app/(app)/projects/[owner]/[name]/page.tsx` exists (CMP-2): it finds the watched repository by its key and shows
  only its access status, main branch and check time, with the placeholder `repositories.projectPlaceholder`.
  The overview row (`src/overview/overview-row.tsx`) and the sidebar (`src/shell/app-sidebar.tsx`) already link to
  `/projects/<owner>/<name>`. The roadmap's estimate `app/(app)/projects/[slug]/page.tsx` is this route.
- The scan stores per project the last good `context/state.json` (schema 2) and owner-word issues in
  `projects.reads` (`modules/projects/reads.ts`: `status`, `state`, `issues`, `readAt`, `lastGoodAt`); a failed read
  keeps the last good state. `findReads` lists every row.
- `src/state/state-schema.ts` holds the schema 2 contract: `active_roadmap` (`slug`, `title`, `path`, `done`,
  `total`, `items[]` with `id`, `change_id`, `outcome`, `status`, `stage`, `since`, `detail`, `prerequisites`),
  `queued[]` (`slug`, `title`, `path`, `start_condition`, `done`, `total`), `open_changes[]` (`change_id`, `title`,
  `status`, `roadmap_item`, `updated`, `stage`), `owner_queue[]`, `main_branch`, `updated_at`.
- `src/inbox/load-inbox.ts` + `build-inbox.ts` build every entry row with its answer state (open, sending, sent,
  done, previous answer); `src/inbox/inbox-row.tsx` renders one row with the answer form, and
  `app/(app)/inbox/answer/actions.ts` (`answerEntryAction`) answers it and revalidates the whole layout, so the
  project page refreshes too.
- `src/scan/read-status.tsx` renders a read status with the `scan.status` words; `scan.reasons` explain each failure.
- The forge's API base is `FORGE_API_URL` (default `https://api.github.com`); no web URL is stored. The e2e points
  it at the fake forge (`playwright.config.ts`).
- The skills' `state.json` lists only the items not done in `active_roadmap.items` (this repository's own state:
  CMP-1..8 are absent), in roadmap order; `done`/`total` carry the counter.

## Findings
- Answering on the page needs no new write: filter the inbox rows by project key and render `InboxRow` with the
  same action (FR-10 "answer exactly as in the inbox").
- Links need a web origin: derive it from the API URL (`https://api.github.com` → `https://github.com`,
  `<origin>/api/v3` → `<origin>`, anything else → its origin). Paths: repository `/<owner>/<name>`, a file
  `/blob/<branch>/<path>`, a change folder `/tree/<branch>/context/changes/<change-id>`.
- An item's stage: `stage` when set (e.g. `implement 2/3`), else its `status`; `detail` and `since` add context.
- Empty cases (FR-10): no stored state at all → "no state read"; a state without an active roadmap → says so.
- Read failure (FR-10): `read.status !== "ok"` with a stored state → show the failure word, its reason and the read
  time above the last good data; the scan's own words are reused.
- No migration, no new forge read, no SOFTURE package gap.

## Risks
- `messages/en.ts` is shared with parallel threads (CMP-12, 14, 19, 21): add a `projectPage` namespace only.
- E2E shares one database; the spec watches its own fake repositories.
