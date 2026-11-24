# Implementation review: readable-roadmap-items

Scope: full · Date: 2026-11-24 · Commits: 051edf5 · Gates: typecheck ✓ lint ✓ test ✓ (520/520) e2e ✓ (64/64)

## Verdict
Ready. The parser drops HTML comments from every text it reads; the view model cuts inline `**Label:**` parts out
of the outcome and the fields, takes `Owner step` apart, folds `Change` and `Depends on` into the change and the
prerequisites, merges repeated labels and splits the rest into short facts and long fields. The view shows the
owner step as a badge and a highlighted block, one facts table and the long fields; the overview's progress moved to
the card's header row and wraps under the title on a phone.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | `SectionCard` gained `actionPlacement` so the progress wraps under the title on a phone (seen in the 390 px screenshot) |
| Scope | PASS | parser, view model, view, section card, messages, CHANGELOG |
| Progress honesty | PASS | |
| Correctness | PASS | the row's and the block's prerequisites are now one list (union), so a block that adds one is no longer ignored |
| Tests | PASS | comments (closed, unclosed, in rows, fields, lists, checks), labelled parts, owner step from outcome and field, repeated labels, e2e on a messy item |
| Security | PASS | comments are removed, never rendered; inline markdown stays text-only |

## Findings
None.

## Decisions (auto)
- Parts taken out of the outcome come first among the facts, before the block's fields.
- The Polish label reuses the wording of the roadmap's owner-steps section title.
