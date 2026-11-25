# Research: wake-setup-link-opens

## Where it lives
- `src/adapters/wake/owner-word-wake.ts` exports `WAKE_SETUP_URL`; `src/adapters/wake/wake-chip.tsx` (`WakeDetails`)
  renders it as the outline button on the project page whenever the routine is not declared.
- `e2e/wake.spec.ts` asserts the button's `href` against its own copy of the same (wrong) URL, so it passed.

## Evidence
- From the production server (`curl -L -o /dev/null -w '%{http_code}'`): `SOFTURE/SKILLS/blob/main/routines/cockpit-wake.md`
  404, `blob/master/routines/cockpit-wake.md` 200, repository default branch `master`.
- `@softure-ai/skills` 0.39.1 (npm) ships `routines/cockpit-wake.md` with the heading `## Setting it up`, so the
  `#setting-it-up` anchor resolves on GitHub.
- No other link in `src/` points into the skills repository.

## Reuse
- None needed: one constant changes.
