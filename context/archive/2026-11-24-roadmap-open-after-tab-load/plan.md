# Plan: roadmap-open-after-tab-load

## Approach
Wait for a tab's document to load before clicking anything on it, assert the URL after each roadmap link click, and
print the page snapshot of each e2e failure in the CI log.

## Phase 1: Load before click, diagnose on failure

- Files: `e2e/project-page.spec.ts`, `.github/workflows/ci.yml`.
- Mode: test-after (test infrastructure).
- Done when: the e2e green under `--workers=4` locally twice; gates green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Load before click, diagnose on failure

#### Automated
- [x] 1.1 `openTab` used for every tab click of the spec; URL asserted after each roadmap open — see Summary
- [x] 1.2 Full e2e with `--workers=4` green twice locally (70 passed, 70 passed) — see Summary
- [x] 1.3 Gates green: typecheck, lint — see Summary
- [x] 1.4 Pull request CI green, all five `ci` jobs — see Summary

## Summary
Merged through the pull request of branch `claude/project-thread-v9mlm0` (no roadmap item).
