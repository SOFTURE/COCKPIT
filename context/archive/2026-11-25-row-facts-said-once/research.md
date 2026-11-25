# Research: row-facts-said-once

## The rule
`src/shell/list-row.tsx` (CT-22): each fact said once; a state shows in one place; a time belongs to the badge or line
it dates; the controls slot holds only controls. The change's Layout: the right column holds badges on line 1 and
controls on line 2; who answered, issue references as text and times go to the muted line under the title.

## Audit (master 81b38ff), every list with its verdict
| List | File | Verdict |
| --- | --- | --- |
| Inbox, answered entry | `src/inbox/inbox-row.tsx` | **repeat / info in controls**: `actions` holds the issue link "Yes · issue #12", the plain span "by Alice" and the issue's fire badges (state in the controls line) beside Retry |
| Inbox, put-off entry | `src/inbox/inbox-row.tsx` | **repeat**: badge "Put off" beside the text "Later · issue #12" in `status` (the same fact twice, and plain text in the state line) |
| Inbox, Answered earlier | `app/(app)/inbox/page.tsx` | **info in controls**: `actions` holds the issue link and "by Alice" |
| Project page, waiting for you | `src/project-page/project-page-sections.tsx` (`EntriesSection`) | uses `InboxRow`: fixed with it |
| Project page, roadmap items, queued roadmaps, open changes | same file | clean: one stage pill or progress bar, details say what the row is |
| History tab, merges | `src/project-page/history/history-sections.tsx` | **repeat**: badge "Merged" and detail "merged <time>" |
| History tab, releases | same | **repeat**: badge "Published" and detail "published <time>" |
| History tab, CI / quality-review runs, doctor findings | same | clean: result badge; the title is the start time; a finding's code badge and its file/message |
| Packages, held packages | `src/adapters/packages/packages-details.tsx` | **info in controls**: `actions` holds "no issue named", the issue as text, or its link |
| Packages, last update | same (`Update`, not a list row) | **repeat**: badge "Merged"/"Open" and "merged <time>"/"opened <time>" |
| Packages, versions | same | clean: "Behind"/"Current" badge, the two versions in the details |
| Scan status | `app/(app)/scan-status/page.tsx` | **repeat**: badge "Read" and line "Read <time>"; for a project never read, badge "Not read yet" and line "Not read yet" |
| Overview | `src/overview/overview-row.tsx` | clean: status word plus drift chips on the right; the reason lines say why the status is Broken and what to do, the chips are the measured values with their links; the read time once |
| Deploys | `src/adapters/deploy/deploys-list.tsx` | clean: last result badge; release, production version, last deploy time, merged count and secrets in the details |
| Team | `src/team/member-list.tsx` | clean: admin/you tags, trash can; joined time in the details |
| Settings, watched repositories | `src/projects/watched-repository-list.tsx` | clean: access badge, trash can; the hint says what to fix, "Checked <time>" |
| Routines, Broadcast | CT-22 / CT-23 | out of this item's lane |

## Reuse
- `IssueFireBadges` and `RetryWakeForm` are already exported from `src/routines/wake-chip.tsx` (CT-23's file, read
  only here): the fires go to the state line, Retry to the controls line, without editing that file.
- `AnswerStateBadge`, `ResultBadge`, theme `Badge` (`data-slot="badge"`), `Status` (`data-slot="status"`).
- e2e: `e2e/capture-evidence.ts` (1280/390 × light/dark), `e2e/expect-row-state.ts`, `e2e/scan-until-settled.ts`.

## Unknowns answered
- "Answered earlier" is not covered by any e2e: it needs an answer whose entry left the queue. The fake forge serves a
  static state; a new optional `stateAfterIssues` (serve another state once N cockpit issues were created) lets one
  spec answer an entry and then see it leave the queue.
- `READ_AT` (`e2e/scan-until-settled.ts`) reads "Read <date>" on Scan status and is reused by `e2e/cli.spec.ts` for the
  overview's "Read <time>": Scan status's line becomes "Checked <time>" (Settings already says "Checked"), so a
  separate `CHECKED_AT` is needed for Scan status while `READ_AT` stays for the overview.

## Risks
- The inbox is the densest screen: the answer form keeps `data-row-wide`, untouched.
- `e2e/answer.spec.ts` reads `getByRole("link", { name: "Yes · issue #1" })` inside the row: the link stays (moved to
  the details), so the locator still finds it.
