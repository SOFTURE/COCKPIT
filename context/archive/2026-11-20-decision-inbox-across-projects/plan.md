# Plan: decision-inbox-across-projects

## Goal
The owner opens the inbox and sees every open owner-queue entry of every project, oldest first, with project, kind,
source, item and age as property chips; answered entries show "sent" or "done"; the sidebar shows the count of
unanswered entries; the inbox is usable on a 390 px phone. Out of scope: answering (CMP-5).

## Approach
**Starting point:** the scan stores each project's last good state and owner-word issues (CMP-3).

**Chosen:** `src/inbox/` reads `projects.reads`, flattens the entries, matches the owner-word markers and sorts by
`since`; the inbox page renders rows with chips; the layout counts the unanswered ones for the sidebar.
Rejected: a table of entries (the state file is the source; a copy would drift).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Order | `since` ascending, no date last, then project and entry id | FR-4 oldest first, stable | PRD |
| Answered | marker in an owner-word issue: open = sent, closed = done | WORKFLOW §8.6, FR-6 | research |
| Count | unanswered entries only | FR-4 | PRD |
| Grouping | none in this item | FR-4 challenge | research |

## Phase 1: Inbox read and screen
**Discipline:** TDD. **Files:** `src/inbox/**`, `app/(app)/inbox/page.tsx`, `app/(app)/layout.tsx`, `messages/en.ts`,
`tests/inbox/**`, `e2e/inbox.spec.ts`, `e2e/fake-forge.ts`.

1. `src/inbox/owner-word-marker.ts`: `parseOwnerWordMarker(body)` → `{ entry, answer } | null`.
2. `src/inbox/build-inbox.ts`: `buildInbox({ reads, repositories, today, timeZone })` → rows and counts (pure).
3. `src/inbox/load-inbox.ts`: loads from the database and calls `buildInbox`.
4. Inbox page: rows with the entry text, chips (project, kind, source, item, age) and the answered status; the empty
   state with the last scan time. Layout: the sidebar count.

**Tests:** `tests/inbox/build-inbox.test.ts` (2, 0 and 5 entries → 7 rows oldest first; sent and done from markers;
no-date last; count; 200 entries over 30 projects built in under 50 ms), `tests/inbox/owner-word-marker.test.ts`;
e2e `e2e/inbox.spec.ts` (after a scan the inbox lists the fictional project's entries, the sidebar shows the count,
no horizontal scroll at 390 px).

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).
- Manual: the inbox renders on the theme in light and dark at 390 px and desktop (evidence: Playwright screenshots
  the run inspects).

## Risks and rollback
- A project whose read fails keeps its last good entries (FR-3): the inbox shows them, which is right until the next
  good read. Rollback: revert the merge; no data change.

## Decisions (auto)
- Entries of a project whose latest read failed stay in the inbox from its last good state.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Inbox read and screen

#### Automated
- [x] 1.1 `tests/inbox/**` pass: 7 rows oldest first, sent and done, count, 200 entries fast — e5cd168
- [x] 1.2 `e2e/inbox.spec.ts` passes: entries after a scan, sidebar count, no horizontal scroll at 390 px — e5cd168
- [x] 1.3 Gates green (typecheck, lint, test) — e5cd168

#### Manual
- [x] 1.4 The inbox renders on the theme in light and dark at 390 px and desktop (evidence: Playwright screenshots the run inspects; verified by the run 2026-11-23: light and dark at 390 and 1280 px, chips wrap on the phone, sidebar count 3) — e5cd168
