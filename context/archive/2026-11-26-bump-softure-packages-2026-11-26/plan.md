# Plan: bump-softure-packages-2026-11-26

## Approach
Install the four new versions, fill the Polish keys the new dialogs read, drop the two app workarounds the theme now
does itself, and run every gate plus the e2e.

## Key decisions
- Polish copy goes in `messages/packages/*-pl.ts`; auth's dictionary is typed complete, so the missing keys turn
  `typecheck` red; mcp-access's is `DeepPartial`, so a unit test guards its new keys.
- The theme's new row components are not adopted here (app-wide UI rollout = separate roadmap items, owner's order).

## Phase 1: Bump and adapt

- Files: `package.json`, `package-lock.json`, `messages/packages/auth-pl.ts`, `messages/packages/mcp-access-pl.ts`,
  `tests/locale/polish-surfaces.test.ts`, `src/shell/row-inset.ts`, `src/shell/status-action-fold-row.tsx`,
  `src/shell/field-help.tsx`, `src/routines/routine-forms.tsx`.
- Mode: test-first for the dictionaries; the removed workarounds are covered by the existing e2e (the routine dialog
  focuses its Provider field; the fold rows' layout).
- Done when: the lockfile resolves the four versions; typecheck, lint, test and e2e are green; the pull request's CI
  is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump and adapt

#### Automated
- [x] 1.1 Lockfile resolves auth 0.2.24, mcp-access 0.7.9, theme-notion 0.35.0, testing 0.6.0 (equal to `npm view`)
- [x] 1.2 auth-pl without the four keys: `typecheck` red (TS2739); green with them
- [x] 1.3 mcp-access confirmation test red without the Polish keys (1 failed), green with them
- [x] 1.4 Gates green: typecheck, lint (language scan), test 776/776
- [x] 1.5 e2e green after the bump (local `npm run build && npm run e2e`, and the pull request's CI `e2e` job)
