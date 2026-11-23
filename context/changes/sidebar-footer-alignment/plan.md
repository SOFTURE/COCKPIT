# Plan: sidebar-footer-alignment

## Approach
The footer passes `LogoutButton` a `className` for its form that turns the form full width and styles the button
inside it as a sidebar row: full width, `justify-start`, horizontal padding of a sidebar menu button (`px-2`), the
row height of the navigation rows. The signed-in line keeps its place; the button's text now starts at the same x.

## Key decisions
- Style through the form's descendant selector (`[&_button]:…`): `LogoutButton` exposes no class for the button.
  The gap (a sidebar-row look, or a class for the button) is filed in SOFTURE/AI.
- Keep `variant="ghost"`: its colours (muted text, hover tint) already match the sidebar's rows.

## Phase 1: Footer alignment

- Files: `src/shell/app-shell.tsx`, `e2e/sidebar-footer.spec.ts`, `CHANGELOG.md`.
- Mode: TDD.
- Done when: an e2e that measures the left edge of the "Log out" text against the "Signed in as" text (desktop
  1280 and mobile 390, the sidebar sheet open) fails on master and passes after; screenshots light/dark at 1280 and
  390 are inspected and stored as evidence; gates green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Footer alignment

#### Automated
- [x] 1.1 Alignment e2e red on master: "Log out" text indented against "Signed in as" (17 px at 1280 and 390)
- [x] 1.2 Footer styles the logout button as a sidebar row; e2e green at 1280 and 390 (`e2e/sidebar-footer.spec.ts`, 2/2); upstream gap SOFTURE/AI#1439
- [x] 1.3 Screenshots light/dark at 1280 and 390 inspected and stored (`cockpit/evidence/sidebar-footer-alignment/01-sidebar-footer-after-{1280,390}-{light,dark}.webp`)
- [x] 1.4 Gates green: typecheck, lint (language scan), test (324/324), doctor
