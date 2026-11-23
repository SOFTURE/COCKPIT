# Implementation review: panel-speaks-polish

Scope: full · Date: 2026-11-23 · Commits: 220dcc4, 4df13dc, 26282b3 · Gates: typecheck ✓ lint ✓ test ✓ (424) e2e ✓ (58)

## Verdict
Ready. `APP_LOCALE=pl` turns COCKPIT's screens, the module pages it configures (sign-in, password, invitations, token
and consent pages, unsubscribe), the digest and invitation mails and the MCP tools to Polish, with Polish dates and
`<html lang="pl">`; English stays the default and the reading of any other value. The CLI follows `COCKPIT_LOCALE`,
else the terminal's language. Tests fail on a missing or extra key, a lost placeholder, an untranslated sentence,
inline copy in a component, and English copy on any screen of the Polish e2e server.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | repository text shown as written; no migration |
| Progress honesty | PASS | |
| Correctness | PASS | MCP markers unchanged in every language (test) |
| Tests | PASS | parity, inline-copy scan, surfaces, CLI, Polish e2e |
| Security | PASS | the setting is allow-listed; no new input, no new forge scope |

## Findings
- Suggestion: mcp-access texts written for the assistant (tool-input, confirmation, operation messages) stay English
  because they carry machine codes; the token and consent pages are Polish. Accepted as is.
- Suggestion: the Polish e2e checks phrases of two words or more; single words are covered by the parity test and
  the screenshots. Accepted as is.

## Decisions (auto)
- One image serves both languages: the language is a runtime variable (`APP_LOCALE`), not a build flag.
- Polish copy names counts as "label: count" instead of adding plural keys.
- Production gets Polish once the repository variable `APP_LOCALE=pl` is set (owner step, recorded in the roadmap).
