---
change_id: app-icon
title: "COCKPIT has its own tab, bookmark and home screen icon"
status: planned
roadmap_item: null
branch: claude/project-thread-vfa0qn
created: 2026-11-23
updated: 2026-11-23
---

## Intent
Browser tabs, bookmarks and the iOS home screen show a COCKPIT icon instead of the browser's generic one, drawn the
way every SOFTURE app draws it: `drawAppIcon` from `@softure-ai/theme-kit/next` in the theme's colours.

## Context
The owner reported the missing favicon from a bookmark bar. The app has no `app/icon.*`, no `public/` folder and no
manifest. The session guard (`proxy.ts`) sends every path without a session cookie to the login page, so an icon
route must also be public, or the login page and a fresh bookmark get no icon.

## Constraints
- Use the package convention (`@softure-ai/theme-kit/next`), no hand-drawn image files.
- The icon routes are public; nothing else becomes public.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the whole convention is the `@softure-ai/theme-kit` README "App icon" section (32 px tab icon,
  180 px apple icon, glyph from `lucide` as data); the only code touch points are `app/` and `src/security/public-paths.ts`.
- Frame skipped: a missing favicon reported by the owner, the outcome is not in doubt.
