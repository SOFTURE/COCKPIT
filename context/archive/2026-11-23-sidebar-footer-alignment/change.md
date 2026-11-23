---
change_id: sidebar-footer-alignment
title: "Log out lines up with the signed-in line in the sidebar footer"
status: archived
roadmap_item: null
branch: claude/project-thread-k013o1
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
In the sidebar footer, "Log out" starts at the same left edge as "Signed in as …" and the navigation rows above,
and reads as a sidebar row (full width, text at the left, the row's hover), instead of a centred ghost button
indented by its own padding.

## Context
The owner reported the misaligned footer from production. The footer (`src/shell/app-shell.tsx`) renders the
signed-in line at the footer's padding and `LogoutButton` of `@softure-ai/auth/next` with `variant="ghost"`. The
button is `@softure-ai/ui`'s `Button` (`px-4`, content-width), and `LogoutButton`'s `className` lands on the
wrapping `<form>`, not on the button, so an app cannot give the button a sidebar row's look.

## Constraints
- No fork of the package: the footer styles the button through the form it controls; the missing option is filed
  in SOFTURE/AI.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the cause is fully visible in two files (`src/shell/app-shell.tsx` and the package's
  `LogoutForm`, which puts `className` on the form and renders `Button` with `px-4`).
- Frame skipped: a visual defect reported by the owner; the outcome is not in doubt.
