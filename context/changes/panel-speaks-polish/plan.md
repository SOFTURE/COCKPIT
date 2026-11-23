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
- [ ] 1.1 Locale setting test red, then green (`APP_LOCALE` en/pl/unknown/missing)
- [ ] 1.2 Parity and inline-copy tests red without `messages/pl.ts`, green with it; module dictionaries complete
- [ ] 1.3 Gates green: typecheck, lint, test

### Phase 2: MCP, CLI, deploy and the Polish e2e

#### Automated
- [ ] 2.1 MCP and CLI read the locale: tests green in `pl` and `en`
- [ ] 2.2 Gates green; e2e (English) green on a production build
- [ ] 2.3 Polish e2e green: no English copy on the checked screens; screenshots inspected and stored
