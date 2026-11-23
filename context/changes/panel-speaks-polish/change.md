---
change_id: panel-speaks-polish
title: "The panel speaks Polish"
status: new
roadmap_item: CV-3
branch: null
created: 2026-11-23
updated: 2026-11-23
---

## Intent
with the app's locale set to `pl` (a runtime setting, `en` stays the default for the open-source build), every screen of the panel (sign-in, sidebar, inbox, overview, project pages, history, roadmap view, broadcast, settings, team), its `aria-label`s, its error messages, the digest mail, the invitation mail and the MCP and CLI labels read in Polish; dates and times use Polish formatting; `<html lang>` follows the locale; a test fails when `messages/pl.ts` misses a key of `messages/en.ts` or when user-visible text is inline in code.

## Context
Roadmap item (cockpit-v2), quoted:

> ### CV-3: The panel speaks Polish
> - **Change ID:** `panel-speaks-polish`
> - **Status:** ready
> - **Outcome:** with the app's locale set to `pl` (a runtime setting, `en` stays the default for the open-source
>   build), every screen of the panel (sign-in, sidebar, inbox, overview, project pages, history, roadmap view,
>   broadcast, settings, team), its `aria-label`s, its error messages, the digest mail, the invitation mail and the
>   MCP and CLI labels read in Polish; dates and times use Polish formatting; `<html lang>` follows the locale; a test
>   fails when `messages/pl.ts` misses a key of `messages/en.ts` or when user-visible text is inline in code.
> - **Prerequisites:** — (CV-1 and CV-2 add their own keys to both dictionaries once CV-3 is merged; whichever merges
>   second translates the other's keys)
> - **Touches (estimate):** `messages/pl.ts` (new), `messages/index.ts`, `softure.config.ts` (`locale` from the
>   environment), `app/layout.tsx`, `src/projects/format-time.ts`, components that still hold inline text,
>   `compose.yaml` and `.github/workflows/deploy.yml` (the locale variable by name), `README.md` (the setting).
> - **Size:** M
> - **Unknowns:**
>   - Does `@softure-ai/core`'s `Locale` already include `pl`, and do `@softure-ai/auth` and `@softure-ai/theme-notion`
>     ship Polish copy for their own screens? A gap any app would hit goes to SOFTURE/AI. (owner: research; blocks: no)
>   - Repository text COCKPIT shows as it is (roadmap titles, entry texts, doctor codes) stays in the project's own
>     language; only COCKPIT's copy is translated. (owner: research; blocks: no)
> - **Risk:** a missed string leaves a mixed-language screen; the key-parity test and an e2e pass in `pl` guard it.
> - **Baseline:** today the panel is English only (`messages/en.ts`, 585 lines, `locale: "en"`); after: the e2e
>   suite runs once with `pl` and finds no English copy on the inbox, overview and settings screens (screenshots at
>   1280 and 390 px, light and dark), the parity test is green, and the default build still renders English.
> - **PRD refs:** F-3, NFR-3, NFR-4
> - **Input:** context/changes/panel-speaks-polish/change.md

Owner input (2026-11-23, translated): "add to the current roadmap that the whole panel is in Polish".

Findings gathered for this item:
- `messages/index.ts` holds one dictionary, `en` (`DICTIONARIES: Record<Locale, AppMessages | undefined> = { en }`),
  and `getMessages(locale)` falls back to English for any locale.
- `softure.config.ts` sets `locale: "en"` as a constant (next to `APP_TIMEZONE`, which already comes from the
  environment); `app/layout.tsx` renders `<html lang={config.locale}>`.
- `src/projects/format-time.ts` (`createTimeFormatter(locale, timeZone)`) formats dates by the locale;
  `src/digest/run-digest.ts` renders the digest with `getMessages(context.config.locale)`.
- The CLI (`cli/**`) prints tables from the MCP tools; its labels are part of the copy to translate.
- The SOFTURE language rule keeps code, identifiers and docs in English; user-facing copy lives in message
  dictionaries such as `messages/pl.ts`.

## Constraints
- Exclusively owned: `messages/pl.ts`, `messages/index.ts`, the `locale` line of `softure.config.ts`.
- `en` stays the default; Polish is a runtime setting (the repository is generic and open source).
- Text read from watched repositories is shown as it is, never translated.
- No release or deploy without the owner's word.
