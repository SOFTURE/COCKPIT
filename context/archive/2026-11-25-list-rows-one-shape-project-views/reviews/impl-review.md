# Implementation review: list-rows-one-shape-project-views

Reviewed: branch `claude/project-thread-9wkv74` against plan.md. Verdict: ready to archive.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (every listed screen moved; tone map in one place; `settings-row.tsx` left as decided) |
| Correctness | PASS (no row text or link changed; `data-*` selectors kept; chip links on the overview and controls on Deploys sit above the stretched link) |
| Tests | PASS (tone map, answer state badge, wide row and arrow pinned in unit tests; e2e reads the state in the right column on overview, project page, history, deploys and packages at 1280 and 390 px) |
| Progress honesty | PASS |
| Migrations | PASS (none) |
| Security | PASS (external links `rel="noreferrer"`, no new input) |
| Patterns | PASS (colours only through the theme's tones; CT-18's components extended, not copied) |

## Findings
- Warning: on a phone the overview row's state column wrapped and left the arrow alone on a line (seen in the
  screenshots). Fixed in `ListRow`: the arrow stays beside the state; unit test added.
- Suggestion: the overview row is dense on a phone (ten chips). Accepted as is: chips wrap under the name, the state
  stays on the right; a denser overview is a product question, not this item's.

## Decisions (auto)
- Running and pending read gray everywhere (history runs, deploy steps, doctor pending, package update open); a merge
  and a published release read green; a prerelease gray; a skipped verification orange.
- Drift chips are warning result badges with their own icon.
