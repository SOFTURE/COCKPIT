# Research: panel-speaks-polish

## How the copy reaches the screens today
- `messages/en.ts` (645 lines, `as const`) is COCKPIT's only dictionary; `messages/index.ts` maps `{ en }` and
  `getMessages(locale)` falls back to English. `AppMessages = typeof en` carries literal string types, so a second
  dictionary cannot satisfy it as it is: the type has to be widened to `string` leaves (same keys, any text).
- Every page and server action already reads `getMessages(config.locale)` and formats times with
  `createTimeFormatter(config.locale, config.timezone)` (18 call sites). The screens hold no inline copy: a scan of
  `src/**/*.tsx` and `app/**/*.tsx` for JSX text and literal `aria-label`/`title`/`placeholder` finds nothing.
- Direct imports of `en` bypass the locale: `src/mcp/cockpit-server.ts`, `src/mcp/answer-tool.ts`,
  `src/mcp/tool-catalog.ts` (MCP instructions, tool titles, descriptions, answers) and `cli/render-views.ts`,
  `cli/call-tool.ts`, `cli/run-cli.ts` (the terminal labels).
- `softure.config.ts` fixes `locale: "en"`; `app/layout.tsx` renders `<html lang={config.locale}>`, so `lang` follows
  the config once the config reads the locale from the environment.
- The digest (`src/digest/run-digest.ts`) already renders with `getMessages(context.config.locale)`.

## SOFTURE modules
- `@softure-ai/core`: `Locale` is any BCP 47 string; `selectMessages(dictionaries, locale)` picks `pl`, else `en`.
- `@softure-ai/auth` (login, register notice, change password, invitation panel, invitation mail), `@softure-ai/
  mcp-access` (token page, OAuth consent) and `@softure-ai/mailing` (unsubscribe page, mail footer) ship English only
  and take "partial dictionaries per locale (`en` built in; any other is the app's own translation)" through the
  factory option `messages`. Polish copy for them is the app's own translation by the packages' design, not a gap.
- `@softure-ai/mcp-access` `tools[].title|description|example` take `{ en, <locale>? }`.
- `@softure-ai/theme-notion` components take their copy through props; COCKPIT already passes its own copy to the
  ones it uses (sidebar toggle, breadcrumb label).

## Answers to the item's unknowns
- `Locale` includes `pl` (any tag). The packages ship no Polish copy; COCKPIT passes its own (above). No SOFTURE/AI
  issue: the per-locale override is the packages' documented path.
- Text read from watched repositories (roadmap titles, entry texts, doctor codes, file names) is shown as it is;
  only COCKPIT's copy is translated. Roadmap section names in `roadmapView.checkSections` stay keyed by the English
  heading the repository uses.

## Deployment
- Runtime settings reach production as repository variables through `app-vars` in `.github/workflows/deploy.yml`
  and are passed to the app and the worker in `docker/prod/docker-compose.yml` (like `APP_TIMEZONE`). A new
  `APP_LOCALE` follows the same path; the owner sets the variable `APP_LOCALE=pl`.

## Risks
- A missed string leaves a mixed-language screen: guarded by a key-parity test, an inline-copy scan and an e2e pass
  on a second server started with `APP_LOCALE=pl` that fails when an English dictionary text shows on a screen.
- Polish plurals: COCKPIT's copy uses counts in labels ("{count} failures"); Polish copy is worded around them
  (a label and a count, "Errors: {count}") instead of adding plural machinery.
