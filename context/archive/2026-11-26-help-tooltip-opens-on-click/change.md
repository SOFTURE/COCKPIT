---
change_id: help-tooltip-opens-on-click
title: "A click on a field's \"?\" always opens its hint"
status: archived
roadmap_item: null
branch: claude/project-thread-705p47
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
`e2e/settings.spec.ts` "each setting explains itself in a \"?\" beside its title" failed about one run in five: the
click on "?" did not open the tooltip. `e2e/repository-picker.spec.ts` failed once the same way on "Help: Repository".
A person with a mouse hits it too: the hint they clicked for closes again.

## Context
`FieldHelp` (`src/shell/field-help.tsx`) is the one "?" every field and setting hint uses. It controls the theme's
`Tooltip` (Radix) and toggled `isOpen` on click. Radix's `TooltipTrigger` itself closes the tooltip on pointer down
(when open) and on every click (`onClick: composeEventHandlers(props.onClick, context.onClose)`), and opens it on
hover (`delayDuration: 0` from the sidebar's provider). When hover opens the tooltip after the pointer down (the
open timer, or a pointer-move update not yet committed when the press lands), the click toggles it closed and Radix's
close agrees. Reproduced deterministically in a new test: press the "?", slip off and back while pressed so hover
opens the hint, release: the hint is gone.

The theme's `Tooltip` is a thin Radix wrapper and behaves as Radix documents (a tooltip is not a click target), so
the defect is COCKPIT's click handler, not the theme. A shared tap-friendly help tooltip in the theme is a separate
gap, filed in SOFTURE/AI.

## Constraints
- One component, `FieldHelp`; every "?" in the app uses it, so all of them get the fix.
- No retries, no loosened assertion, no release.

## Notes
- Research skipped: the cause is read from Radix's trigger source and reproduced by a test; recorded above.
- Frame skipped: a failing e2e and a visible bug are fixed at once (AGENTS.md → CI).

## Done
- A click on "?" always opens the hint: the handler calls `preventDefault` (Radix then skips its close on click) and
  sets the tooltip open instead of toggling it. Escape, a press elsewhere, blur and pointer leave still close it.
- New test "a click on the \"?\" keeps the hint open when hover opened it during the press" in
  `e2e/settings.spec.ts`: red on the old code (3 of 3), green with the fix.
