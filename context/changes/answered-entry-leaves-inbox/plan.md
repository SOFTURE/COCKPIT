# Plan: answered-entry-leaves-inbox

## Approach
1. `build-inbox.ts`: `DEFERRAL_PATTERN` matches `(later: #N` anywhere in the text (word boundary after the number).
2. `build-inbox.ts`: when no answer matches the exact text, the newest answer of the same entry id whose issue number
   the new text cites (`#N` not followed by a digit) is the entry's answer: no reopen, no previous answer.
3. `issues.ts`: the settle steps follow SOFTURE/SKILLS 0.37.0 (every answer takes the entry off the queue; Later
   moves the item to `roadmaps/roadmap-later.md` under a new ID; never re-word in place).
4. CHANGELOG entry under 0.7.0 (unreleased).

## Key decisions
- Citing the issue number is the project's own signal that it is settling that answer; a re-wording that does not
  cite it is still a new question and opens the entry again (existing behaviour kept).

## Phase 1: Answered entries stay answered

- Files: see research.md.
- Mode: TDD: new unit tests red first.
- Done when: new tests fail before and pass after; gates green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Answered entries stay answered

#### Automated
- [x] 1.1 New unit tests red before the fix (3 failed: settling text reopened, mid-text later not deferred, footer still says "leave it open")
- [x] 1.2 Green after the fix: `vitest` build-inbox + issues 27/27
- [x] 1.3 Gates green: typecheck, lint (language scan), test 535/535
