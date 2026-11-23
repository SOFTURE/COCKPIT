---
change_id: project-page-and-roadmap-view
title: "A readable project page and a roadmap view inside COCKPIT"
status: archived
roadmap_item: null
branch: claude/project-thread-f55mzs
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
A project's page reads at a glance in the same card style as Settings: what waits for the owner first, then the
active roadmap with its progress, the queued roadmaps and the open changes. Opening a roadmap shows it inside
COCKPIT, parsed from its markdown (items with their status, outcome, prerequisites, size and details, the start
condition, the run-wide orders and the owner's open steps), instead of sending the owner to the forge. The Inbox
reads the same way: each entry a compact row with its project, kind and age, and Notion-sized answer buttons.

## Context
The owner reported the project page as unreadable (screenshot in the thread): plain headings over bare lists, a
queued roadmap's title is an underlined link to GitHub, and each "Waiting for you" entry repeats the project name
and a raw file path as chips above three oversized buttons. The roadmap itself is only on the forge.

## Constraints
- The owner widened the scope in the same thread (2026-11-23 16:23 Warsaw): the Inbox gets the same treatment, and
  the skills may be changed directly in SOFTURE/SKILLS so roadmaps stay parseable.
- Keep every function of the page: read status and failure notice, links to the repository and history, active
  roadmap items with stage and change link, queued roadmaps with start condition, open changes, entries answered as
  in the inbox, health and deploy.
- theme-notion components only (`Card`, `PageHeader`, `MiniProgress`, `FoldRow`, `Badge`, `Status`), design tokens,
  copy in `messages/en.ts`.
- The roadmap view reads the roadmap file from the forge when opened (like the history page); the scan is unchanged
  (NFR-2) and the read is read-only (NFR-7). Only files under `context/` named in the project's state are read.
- When the markdown cannot be read or parsed, the view falls back to the items `context/state.json` carries.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the touch points (project page, its sections, the forge client, the inbox row, the e2e fake
  forge) were read in full while opening the change; the roadmap format is the one `softure-roadmap` writes and
  `context_state.py` parses (WORKFLOW §5).
- Frame skipped: the owner named the problem and the outcome; nothing is in doubt.
- The roadmap item blocks (`### ID: title` with `- **Field:** value` lines) are written by the skill but not checked
  by the doctor; a doctor check that keeps them parseable is proposed in SOFTURE/SKILLS.
