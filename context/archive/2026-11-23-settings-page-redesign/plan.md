# Plan: settings-page-redesign

## Approach
Rebuild `app/(app)/settings/page.tsx` as a column at most `max-w-3xl` wide holding three theme-notion `Card`s.
Each card has a header (an `h2` title, a one-line description, and the section's secondary action on the right) and
its content. Watched repositories: "Scan status" as an outline button in the header, the add form (field and button on
one line, the field no wider than the card) and the list. Team (admins only): one row, "Manage the team" as an outline
button. Account: three rows (password, assistant access, session), each a title, a hint and one outline button on the
right. Log out posts to auth's `logoutAction` through a theme-notion `Button`, so it matches its neighbours.

## Key decisions
- Cards from theme-notion (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`), the
  shadcn composition every theme-notion app uses; no new local primitives beyond one `SettingsRow`.
- All actions are outline buttons at the touch size on a phone and 28 px from `md` (the app's existing pattern), the
  add button stays primary.
- Log out: a small server component around auth's exported `logoutAction` and its own copy; the size mismatch of
  `LogoutButton` in theme-notion apps is SOFTURE/AI#1439 (its className never reaches the button).
- The link names the e2e specs use stay ("Scan status", "Manage the team"); "Assistant access (MCP)" becomes the
  row's title and its button reads "Manage tokens".

## Phase 1: Settings cards

- Files: `app/(app)/settings/page.tsx`, `src/settings/settings-row.tsx`, `src/settings/sign-out-form.tsx`,
  `src/projects/add-repository-form.tsx`, `src/projects/watched-repository-list.tsx`, `messages/en.ts`,
  `e2e/mcp.spec.ts`, `e2e/settings.spec.ts`, `CHANGELOG.md`.
- Mode: test-after (a layout change; behaviour is covered by the existing e2e specs).
- Done when: the settings e2e spec (cards and their actions visible, log out signs out, no horizontal scroll at
  390 px) and the existing specs that walk through Settings pass on a production build; screenshots at 1280 and
  390 px in light and dark are inspected and stored as evidence; gates green; the pull request's CI is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Settings cards

#### Automated
- [x] 1.1 Settings page rebuilt as cards with consistent buttons; copy in the dictionary — b8b4926
- [x] 1.2 e2e: `settings.spec.ts` plus the specs that walk Settings green on a production build (full e2e 44/44 on `next start`) — b8b4926
- [x] 1.3 Screenshots 1280/390 light/dark inspected and stored as evidence (`cockpit/evidence/settings-page-redesign/01-settings-after-{1280,390}-{light,dark}.webp`) — b8b4926
- [x] 1.4 Gates green: typecheck, lint (language scan), test (324/324), doctor — b8b4926
