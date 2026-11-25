# Implementation review: roadmap-items-aligned-orders-parsed

Scope: full · Date: 2026-11-25 · Commits: c5606d4 · Gates: typecheck ✓ lint ✓ test ✓ doctor ✓

## Verdict
Ready. Each item row's summary on the roadmap view is one grid: the ID column (a grey mono tag, shared with the
project page through `ItemIdBadge`), the content column (title, status detail, outcome) and the status column on
the title's line (under the title on a phone); the chevron sits on the first line. The order parser splits at the
first colon outside backticks and keeps a label's trailing parenthetical as its `note`; `describeOrder` translates
the known labels and plain values and passes anything else through. Screenshots light/dark at 1280 and 390 were
inspected; a first pass showed the detail and outcome starting under the ID at 1280 (`sm:col-span-2` overrode the
column start) and was fixed with an explicit column end before the evidence was stored.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | parser, roadmap view, the project page's ID cell, two message keys groups |
| Progress honesty | PASS | |
| Correctness | PASS | labels without a colon outside code are not orders (as before); empty values are skipped (as before) |
| Tests | PASS | parser red then green; translation unit tests; e2e on the order, its note and the ID tags |
| Security | PASS | presentation only; every order part still renders through InlineMarkdown |

## Findings
None.

## Decisions (auto)
- "after <text>" is translated only before an item ID ("after OM-8" → "po OM-8"), so free text is never half
  translated.
- The note (`Mode: owner`) is shown as written, under the value: it names a roadmap column value, not panel copy.
