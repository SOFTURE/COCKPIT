# Implementation review: routines-by-provider

Reviewed: 3a34cc0, 361aea1 and the README commit against plan.md. Verdict: approve. Findings: 0 critical, 0 warning,
2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (migration 0008, adapter contract and registry, Claude Code adapter from the moved `routines-api.ts` and `trigger-id.ts`, wake/Test/add through the registry, Provider select, e2e, README, CHANGELOG) |
| Correctness | PASS (a routine of an unregistered provider or with unreadable settings fails its fire as `provider_unknown` / `settings_invalid` without a call; the fire queue, limits, fire records and Retry are unchanged) |
| Tests | PASS (migration test rolls back to the 0007 shape, migrates a stored routine and fires it; a fake second provider registered only in the test is added, tested and fired; the database refuses a Claude Code routine with a bad trigger id; e2e reads the Provider list) |
| Migration safety | PASS (forward-only, one transaction, rollback in the header and exercised by the test; the token columns are untouched) |
| Security | PASS (actions keep `requireUser` and the watched-project check; the token never reaches a log, the page or an error; log lines name the provider instead of the trigger id) |
| Patterns | PASS (theme `Select`, `FieldHelp`; provider ids beside `routine-kinds.ts` with no server imports) |

## Findings
- Suggestion: with the Provider "?" first in the dialog, opening it focused that button and showed its tooltip.
  Fixed: shared `focusFirstField` (`src/shell/field-help.tsx`) as the dialog's `onOpenAutoFocus`; the e2e checks the
  Provider list has focus and no tooltip is open (361aea1). Other dialogs whose first control is a "?" can use it.
- Suggestion: the Polish dictionary test flagged "Claude Code" as untranslated. Kept: it is a product name, listed
  among the texts that read the same in both languages.

## Decisions (auto)
- Approved. No edit dialog is built (none existed); the Provider choice lives in the add dialog.
