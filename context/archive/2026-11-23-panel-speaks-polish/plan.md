# Plan: panel-speaks-polish

## Approach
`APP_LOCALE` (`en` by default, `pl` supported; anything else reads `en`) sets `config.locale`. COCKPIT gets
`messages/pl.ts` with every key of `messages/en.ts`, typed by a widened `AppMessages` (same keys, string leaves), and
Polish dictionaries for the auth, mcp-access and mailing modules passed through their `messages` option. MCP and the
CLI stop importing `en` directly: the server reads `getMessages(config.locale)`, the tool catalog carries `{ en, pl }`,
and the CLI picks its locale from `COCKPIT_LOCALE` (else the language of `LC_ALL`/`LANG`). The deploy passes
`APP_LOCALE` to the app and the worker.

## Key decisions
- Runtime variable, not a build flag: one image serves both languages; `en` stays the open-source default.
- The CLI runs on the owner's machine, so it has its own setting (`COCKPIT_LOCALE`), falling back to the terminal's
  language.
- Polish copy avoids count-dependent nouns (a label and a count, "Errors: {count}") instead of new plural keys.
- The `pl` e2e runs as its own Playwright project against a second server (own port and PGlite directory,
  `APP_LOCALE=pl`); the English suite stays as it is.

## Phase 1: Locale setting and the Polish dictionaries
- Files: `src/locale/app-locale.ts` (new), `softure.config.ts`, `messages/index.ts`, `messages/en.ts` (type only),
  `messages/pl.ts` (new), `messages/packages/{auth,mcp-access,mailing}-pl.ts` (new), `tests/locale/*.test.ts`.
- Mode: TDD.
- Done when: tests for the locale setting, key parity (every key of `en` in `pl`, no extra keys, same `{placeholders}`)
  and the inline-copy scan pass; `getMessages("pl")` returns Polish; times format in Polish.

## Phase 2: MCP, CLI, deploy and the Polish e2e
- Files: `src/mcp/{cockpit-server,answer-tool,tool-catalog}.ts`, `cli/*.ts`, `docker/prod/docker-compose.yml`,
  `.github/workflows/deploy.yml` (comment), `README.md`, `cli/README.md`, `playwright.config.ts`, `e2e/polish.spec.ts`
  (new), `CHANGELOG.md`, tests of MCP and CLI.
- Mode: test-after.
- Done when: MCP and CLI tests show Polish labels with `pl` and English by default; gates green; the full e2e (English)
  green on a production build; the Polish e2e finds no English dictionary text on sign-in, inbox, overview, settings,
  team, broadcast and token pages; screenshots at 1280 and 390, light and dark, inspected and stored.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Locale setting and the Polish dictionaries

#### Automated
- [x] 1.1 Locale setting test red, then green (`APP_LOCALE` en/pl/unknown/missing; red: module missing; `tests/locale/app-locale.test.ts` 7/7) — 220dcc4
- [x] 1.2 Parity and inline-copy tests red without `messages/pl.ts`, green with it; module dictionaries complete (`tests/locale/dictionaries.test.ts` 6/6; auth and mailing complete, mcp-access human-facing groups) — 220dcc4
- [x] 1.3 Gates green: typecheck, lint (language scan), test — 220dcc4

### Phase 2: MCP, CLI, deploy and the Polish e2e

#### Automated
- [x] 2.1 MCP and CLI read the locale: tests green in `pl` and `en` (`tests/locale/polish-surfaces.test.ts` 8/8, `tests/cli/run-cli.test.ts` Polish case) — 4df13dc
- [x] 2.2 Gates green: typecheck, lint, test (424/424); e2e 58/58 on a production build (55 English, 3 Polish) — 26282b3
- [x] 2.3 Polish e2e green: 342 English phrases checked on sign-in, unsubscribe and 12 screens, none found; `<html lang="pl">`; Polish dates. Screenshots of inbox, overview and settings at 1280 and 390, light and dark, inspected and stored (`cockpit/evidence/panel-speaks-polish/0{1,2,3}-*-after-{1280,390}-{light,dark}.webp`) — 26282b3
