# Plan: app-icon

## Approach
Add `app/icon.tsx` (32 × 32, rounded) and `app/apple-icon.tsx` (180 × 180, square, iOS rounds it) that return
`drawAppIcon({ theme, icon: Gauge })` with the theme-notion theme, and the framework-free `lucide` package for the
glyph as data, next to `lucide-react`. Next links both from every page's `<head>`. `/icon` and `/apple-icon` join
`PUBLIC_PATHS`, so the guard serves them without a session.

## Key decisions
- Glyph `Gauge`: a cockpit instrument, reads at 16 px.
- Default tone (`primary`) and stroke, as in the package README; no manifest, since COCKPIT is not an installable app.
- No `favicon.ico`: Next's `icon` metadata route covers every current browser.

## Phase 1: App icon

- Files: `app/icon.tsx`, `app/apple-icon.tsx`, `src/security/public-paths.ts`, `tests/security/public-paths.test.ts`,
  `tests/app/app-icon.test.ts`, `e2e/app-icon.spec.ts`, `package.json`, `package-lock.json`, `CHANGELOG.md`.
- Mode: TDD.
- Done when: tests that the icons render as PNG of their declared size and that `/icon` and `/apple-icon` pass the
  guard fail on master and pass after; a production build serves both icons and links them from the login page's
  `<head>` without a session (checked with curl); gates green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: App icon

#### Automated
- [x] 1.1 Icon and public-path tests red on master: icon files missing, `/icon` redirected to login — 70d91b4
- [x] 1.2 `app/icon.tsx`, `app/apple-icon.tsx` and the public paths; tests green (5/5) — 70d91b4
- [x] 1.3 Production build: `/icon` and `/apple-icon` answer 200 `image/png` without a cookie, the login page links both (`e2e/app-icon.spec.ts` and sign-in specs, 6/6; icons inspected: `cockpit/evidence/app-icon/01-apple-icon-after-180-light.webp`, `02-tab-icon-after-32-light.webp`) — 70d91b4
- [x] 1.4 Gates green: typecheck, lint (language scan), test (322/322), doctor — 70d91b4
