# Plan: roadmap-open-waits-under-load

## Approach
Use the existing `OPEN_FROM_FORGE_MS` on the first wait after every roadmap-page open in `e2e/project-page.spec.ts`:
the "Omicron v2" heading, the unreadable-file notice, and the phone view's "Omicron v1" heading.

## Key decisions
- One named bound for one cause (the forge read on open), no global timeout change.

## Phase 1: Bound every roadmap open

- Files: `e2e/project-page.spec.ts`.
- Mode: test-after (test infrastructure).
- Done when: the e2e green under `--workers=4`; gates green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bound every roadmap open

#### Automated
- [x] 1.1 Every first wait after a roadmap-page open uses `OPEN_FROM_FORGE_MS` — see Summary
- [x] 1.2 Gates green: typecheck, lint (language scan) — see Summary
- [x] 1.3 Pull request CI green, all five `ci` jobs, then master CI green — see Summary

## Summary
Merged through the pull request of branch `claude/project-thread-v9mlm0` (no roadmap item).
