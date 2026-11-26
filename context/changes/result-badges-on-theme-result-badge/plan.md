# Plan: result-badges-on-theme-result-badge

## Approach
Bump `@softure-ai/theme-notion` to 0.37.0, import `ResultBadge` and `Tone` from the theme in every badge caller, pass
the caller's attribute as a plain `data-*` prop, delete `src/shell/result-badge.tsx` and its test. Tests read badges
through one markup helper (`tests/support/result-badge-markup.ts`) and one e2e helper (`e2e/expect-result-badge.ts`).

## Key decisions
- See research.md `## Decisions (auto)`.
- No local wrapper: `StepBadge` in `deploy-details.tsx` only maps a step look to the theme badge's props.

## Phase 1: Badges on the theme

- Files: the 15 callers named in change.md, `src/status/state-colors.ts`, `src/adapters/deploy/deploy-step-looks.ts`,
  `package.json`, `package-lock.json`, tests and e2e that read badge attributes.
- Mode: test-after (a component swap; the behaviour is the theme's).
- Done when: no file imports `shell/result-badge`; typecheck, lint, unit tests and the full e2e pass locally and in the
  pull request's CI; screenshots before and after at 1280/390 light/dark were looked at.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Badges on the theme

#### Automated
- [ ] 1.1 theme-notion 0.37.0; every caller on the theme's `ResultBadge`; local badge and `getResultColor` deleted
- [ ] 1.2 Unit tests per badge caller (tone, colour, icon, word, title, own `data-*`, spinning) via `tests/support/result-badge-markup.ts`
- [ ] 1.3 e2e on overview, inbox, routines, broadcast, history, deploys, packages read badges by `data-slot`, `data-tone` and their own attribute at 1280 and 390 px (`e2e/expect-result-badge.ts`)
- [ ] 1.4 Gates and the full e2e green locally and in the pull request's CI

#### Manual
- [ ] 1.5 Screenshots before and after (overview, inbox, routines, broadcast, history, deploys, packages; 1280/390, light/dark) looked at, saved under `cockpit/evidence/result-badges-on-theme-result-badge/`
